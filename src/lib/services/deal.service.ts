import { Prisma } from "@prisma/client";
import type { DealStatus, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, diff as auditDiff } from "@/lib/audit";
import { assertCan, can } from "@/lib/rbac";
import { appendAfter, firstPosition, positionBetween } from "@/lib/fractional-index";
import type {
  DealAssignInput,
  DealBulkActionInput,
  DealCreateInput,
  DealListQuery,
  DealMoveInput,
  DealUpdateInput,
} from "@/lib/validations/deal";

export const DEAL_INCLUDE = {
  company: { select: { id: true, type: true, name: true } },
  client: {
    select: { id: true, name: true, logoUrl: true, accountTier: true, companyId: true },
  },
  pipeline: { select: { id: true, name: true, companyId: true } },
  stage: {
    select: {
      id: true,
      name: true,
      color: true,
      probability: true,
      isWon: true,
      isLost: true,
    },
  },
  ownerEmployee: {
    select: {
      id: true,
      employeeCode: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  },
  createdBy: {
    select: { id: true, email: true, fullName: true },
  },
  _count: { select: { activities: true } },
} satisfies Prisma.DealInclude;

export type DealWithRelations = Prisma.DealGetPayload<{
  include: typeof DEAL_INCLUDE;
}>;

export type DealListResult = {
  items: DealWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

async function resolveCompanyId(companyType: string): Promise<string> {
  const company = await db.company.findUnique({
    where: { type: companyType as never },
  });
  if (!company) throw statusError(400, `Unknown company: ${companyType}`);
  return company.id;
}

export async function listDeals(
  viewer: User,
  query: DealListQuery,
): Promise<DealListResult> {
  assertCan(viewer, "deals.read");

  const where: Prisma.DealWhereInput = {};
  if (query.onlyDeleted) where.deletedAt = { not: null };
  else if (!query.includeDeleted) where.deletedAt = null;

  if (query.pipelineId) where.pipelineId = query.pipelineId;
  if (query.stageId?.length) where.stageId = { in: query.stageId };
  if (query.status?.length) where.status = { in: query.status };
  if (query.clientId) where.clientId = query.clientId;
  if (query.ownerEmployeeId) where.ownerEmployeeId = query.ownerEmployeeId;

  if (query.minValue !== undefined || query.maxValue !== undefined) {
    const filter: Prisma.DecimalFilter = {};
    if (query.minValue !== undefined) filter.gte = new Prisma.Decimal(query.minValue);
    if (query.maxValue !== undefined) filter.lte = new Prisma.Decimal(query.maxValue);
    where.value = filter;
  }

  if (query.closingBefore || query.closingAfter) {
    const filter: Prisma.DateTimeFilter = {};
    if (query.closingBefore) filter.lte = query.closingBefore;
    if (query.closingAfter) filter.gte = query.closingAfter;
    where.expectedClose = filter;
  }

  if (query.stuckDays !== undefined && query.stuckDays > 0) {
    const cutoff = new Date(Date.now() - query.stuckDays * 24 * 60 * 60 * 1000);
    where.updatedAt = { lte: cutoff };
    where.status = { in: ["OPEN"] };
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { client: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const orderBy = parseSort(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await db.$transaction([
    db.deal.count({ where }),
    db.deal.findMany({
      where,
      include: DEAL_INCLUDE,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function parseSort(
  sort: DealListQuery["sort"],
): Prisma.DealOrderByWithRelationInput | Prisma.DealOrderByWithRelationInput[] {
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const key = sort.replace(/^-/, "");
  switch (key) {
    case "position":
      return [{ position: dir }, { createdAt: "desc" }];
    case "value":
      return { value: dir };
    case "expectedClose":
      return { expectedClose: { sort: dir, nulls: "last" } };
    case "updatedAt":
      return { updatedAt: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function getDeal(viewer: User, id: string) {
  assertCan(viewer, "deals.read");
  return db.deal.findUnique({ where: { id }, include: DEAL_INCLUDE });
}

export async function createDeal(
  actor: User,
  input: DealCreateInput,
  meta: RequestMeta = {},
): Promise<DealWithRelations> {
  assertCan(actor, "deals.create");
  const companyId = await resolveCompanyId(input.companyType);

  const stage = await db.stage.findUnique({
    where: { id: input.stageId },
    select: { id: true, probability: true, isWon: true, isLost: true },
  });
  if (!stage) throw statusError(400, "Stage not found");

  const position = await resolveInitialPosition(input.pipelineId, input.stageId);
  const probability = input.probability ?? stage.probability;
  const stageEnum = mapStageEnum(stage);
  const status: DealStatus = stage.isWon
    ? "WON"
    : stage.isLost
      ? "LOST"
      : input.status;
  const closedAt = stage.isWon || stage.isLost ? new Date() : null;

  const created = await db.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        companyId,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        stageEnum,
        clientId: input.clientId ?? null,
        createdById: actor.id,
        ownerEmployeeId: input.ownerEmployeeId ?? null,
        title: input.title,
        description: input.description ?? null,
        value: new Prisma.Decimal(input.value.toFixed(2)),
        currency: input.currency,
        probability,
        status,
        expectedClose: input.expectedClose ?? null,
        nextStepAt: input.nextStepAt ?? null,
        nextStep: input.nextStep ?? null,
        source: input.source ?? null,
        tags: input.tags,
        closedAt,
        position: new Prisma.Decimal(position.toString()),
      },
      include: DEAL_INCLUDE,
    });
    await tx.dealActivity.create({
      data: {
        dealId: deal.id,
        actorId: actor.id,
        kind: "CREATED",
        toValue: stage.id,
      },
    });
    return deal;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Deal",
    resourceId: created.id,
    after: auditShape(created),
    ...meta,
  });
  return created;
}

export async function updateDeal(
  actor: User,
  id: string,
  input: DealUpdateInput,
  meta: RequestMeta = {},
): Promise<DealWithRelations> {
  const before = await db.deal.findUnique({ where: { id }, include: DEAL_INCLUDE });
  if (!before) throw statusError(404, "Deal not found");
  await assertCanEditDeal(actor, before);

  const data: Prisma.DealUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.value !== undefined) data.value = new Prisma.Decimal(input.value.toFixed(2));
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.probability !== undefined) data.probability = input.probability;
  if (input.expectedClose !== undefined) data.expectedClose = input.expectedClose;
  if (input.nextStepAt !== undefined) data.nextStepAt = input.nextStepAt;
  if (input.nextStep !== undefined) data.nextStep = input.nextStep;
  if (input.source !== undefined) data.source = input.source;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.status !== undefined) data.status = input.status;
  if (input.closedAt !== undefined) data.closedAt = input.closedAt;
  if (input.lostReason !== undefined) data.lostReason = input.lostReason;
  if (input.lostReasonCategory !== undefined) data.lostReasonCategory = input.lostReasonCategory;
  if (input.lostCompetitor !== undefined) data.lostCompetitor = input.lostCompetitor;
  if (input.clientId !== undefined) {
    data.client = input.clientId
      ? { connect: { id: input.clientId } }
      : { disconnect: true };
  }
  if (input.ownerEmployeeId !== undefined) {
    data.ownerEmployee = input.ownerEmployeeId
      ? { connect: { id: input.ownerEmployeeId } }
      : { disconnect: true };
  }

  const updated = await db.deal.update({
    where: { id },
    data,
    include: DEAL_INCLUDE,
  });

  const changed = auditDiff(auditShape(before), auditShape(updated));
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Deal",
    resourceId: id,
    before: changed.before,
    after: changed.after,
    ...meta,
  });
  return updated;
}

export async function moveDeal(
  actor: User,
  id: string,
  input: DealMoveInput,
  meta: RequestMeta = {},
): Promise<DealWithRelations> {
  const before = await db.deal.findUnique({ where: { id }, include: DEAL_INCLUDE });
  if (!before) throw statusError(404, "Deal not found");
  await assertCanEditDeal(actor, before);

  if (input.expectedUpdatedAt) {
    if (before.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
      throw statusError(409, "Position conflict — deal was modified elsewhere");
    }
  }

  const stage = await db.stage.findUnique({
    where: { id: input.stageId },
    select: {
      id: true,
      probability: true,
      isWon: true,
      isLost: true,
      pipelineId: true,
    },
  });
  if (!stage) throw statusError(400, "Stage not found");
  if (stage.pipelineId !== before.pipelineId) {
    throw statusError(400, "Cannot move deal across pipelines");
  }

  const [prev, next] = await Promise.all([
    input.prevId
      ? db.deal.findUnique({
          where: { id: input.prevId },
          select: { position: true },
        })
      : null,
    input.nextId
      ? db.deal.findUnique({
          where: { id: input.nextId },
          select: { position: true },
        })
      : null,
  ]);
  const position = positionBetween(prev?.position ?? null, next?.position ?? null);

  const stageEnum = mapStageEnum(stage);
  const status: DealStatus = stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN";
  const data: Prisma.DealUpdateInput = {
    stage: { connect: { id: input.stageId } },
    stageEnum,
    status,
    position: new Prisma.Decimal(position.toString()),
    probability: stage.probability,
  };
  if (stage.isWon || stage.isLost) {
    if (!before.closedAt) data.closedAt = new Date();
  } else if (before.closedAt) {
    data.closedAt = null;
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.deal.update({
      where: { id },
      data,
      include: DEAL_INCLUDE,
    });
    await tx.dealActivity.create({
      data: {
        dealId: id,
        actorId: actor.id,
        kind: "STAGE_CHANGED",
        fromValue: before.stage.name,
        toValue: row.stage.name,
      },
    });
    return row;
  });

  await audit({
    actorId: actor.id,
    action: "STATUS_CHANGE",
    resourceType: "Deal",
    resourceId: id,
    before: { stageId: before.stageId, status: before.status, position: before.position.toString() },
    after: { stageId: updated.stageId, status: updated.status, position: updated.position.toString() },
    ...meta,
  });
  return updated;
}

export async function assignDeal(
  actor: User,
  id: string,
  input: DealAssignInput,
  meta: RequestMeta = {},
): Promise<DealWithRelations> {
  const before = await db.deal.findUnique({ where: { id }, include: DEAL_INCLUDE });
  if (!before) throw statusError(404, "Deal not found");
  await assertCanEditDeal(actor, before);

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.deal.update({
      where: { id },
      data: {
        ownerEmployee: input.ownerEmployeeId
          ? { connect: { id: input.ownerEmployeeId } }
          : { disconnect: true },
      },
      include: DEAL_INCLUDE,
    });
    await tx.dealActivity.create({
      data: {
        dealId: id,
        actorId: actor.id,
        kind: "ASSIGNED",
        fromValue: before.ownerEmployeeId,
        toValue: input.ownerEmployeeId,
      },
    });
    return row;
  });

  await audit({
    actorId: actor.id,
    action: "ASSIGN",
    resourceType: "Deal",
    resourceId: id,
    before: { ownerEmployeeId: before.ownerEmployeeId },
    after: { ownerEmployeeId: input.ownerEmployeeId },
    ...meta,
  });
  return updated;
}

export async function softDeleteDeal(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "deals.delete");
  const before = await db.deal.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Deal not found");
  await db.deal.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Deal",
    resourceId: id,
    before: { title: before.title, stageId: before.stageId },
    ...meta,
  });
}

export async function restoreDeal(
  actor: User,
  id: string,
  meta: RequestMeta = {},
) {
  assertCan(actor, "deals.delete");
  const restored = await db.deal.update({
    where: { id },
    data: { deletedAt: null },
    include: DEAL_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "RESTORE",
    resourceType: "Deal",
    resourceId: id,
    ...meta,
  });
  return restored;
}

export async function bulkDealAction(
  actor: User,
  input: DealBulkActionInput,
  meta: RequestMeta = {},
): Promise<{ affected: number }> {
  assertCan(actor, "deals.bulk");
  let result: { count: number };

  switch (input.action) {
    case "delete":
      assertCan(actor, "deals.delete");
      result = await db.deal.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      break;
    case "assign":
      assertCan(actor, "deals.update.any");
      result = await db.deal.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { ownerEmployeeId: input.ownerEmployeeId },
      });
      break;
    case "moveStage": {
      assertCan(actor, "deals.update.any");
      const stage = await db.stage.findUnique({
        where: { id: input.stageId },
        select: {
          id: true,
          probability: true,
          isWon: true,
          isLost: true,
          pipelineId: true,
        },
      });
      if (!stage) throw statusError(400, "Stage not found");
      const stageEnum = mapStageEnum(stage);
      result = await db.deal.updateMany({
        where: {
          id: { in: input.ids },
          deletedAt: null,
          pipelineId: stage.pipelineId,
        },
        data: {
          stageId: stage.id,
          stageEnum,
          probability: stage.probability,
          status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
          closedAt: stage.isWon || stage.isLost ? new Date() : null,
        },
      });
      break;
    }
    case "close":
      assertCan(actor, "deals.update.any");
      result = await db.deal.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: {
          status: input.status,
          closedAt: new Date(),
          lostReason: input.status === "LOST" ? input.lostReason ?? null : null,
          lostReasonCategory:
            input.status === "LOST" ? input.lostReasonCategory ?? null : null,
        },
      });
      break;
  }

  await audit({
    actorId: actor.id,
    action: input.action === "delete" ? "DELETE" : "UPDATE",
    resourceType: "Deal",
    metadata: { action: input.action, ids: input.ids, affected: result.count },
    ...meta,
  });
  return { affected: result.count };
}

export async function listDealActivity(viewer: User, dealId: string) {
  assertCan(viewer, "deals.read");
  return db.dealActivity.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

async function resolveInitialPosition(pipelineId: string, stageId: string) {
  const last = await db.deal.findFirst({
    where: { pipelineId, stageId, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  if (!last) return firstPosition();
  return appendAfter(last.position);
}

async function assertCanEditDeal(
  actor: User,
  deal: {
    ownerId: string | null;
    ownerEmployeeId: string | null;
    createdById: string;
  },
): Promise<void> {
  if (can(actor, "deals.update.any")) return;
  if (!can(actor, "deals.update")) {
    throw permissionError("deals.update");
  }
  if (deal.createdById === actor.id) return;
  if (deal.ownerId === actor.id) return;
  const emp = await db.employee.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (emp && emp.id === deal.ownerEmployeeId) return;
  throw permissionError("deals.update.any");
}

function permissionError(perm: string): Error & { status: number } {
  const err = new Error(`Permission denied: ${perm}`) as Error & { status: number };
  err.status = 403;
  return err;
}

function mapStageEnum(stage: { isWon: boolean; isLost: boolean; probability: number }) {
  if (stage.isWon) return "CLOSED_WON" as const;
  if (stage.isLost) return "CLOSED_LOST" as const;
  if (stage.probability >= 75) return "NEGOTIATION" as const;
  if (stage.probability >= 50) return "PROPOSAL" as const;
  if (stage.probability >= 25) return "QUALIFIED" as const;
  return "PROSPECT" as const;
}

function auditShape(d: DealWithRelations) {
  return {
    id: d.id,
    title: d.title,
    stageId: d.stageId,
    status: d.status,
    value: d.value.toString(),
    currency: d.currency,
    probability: d.probability,
    clientId: d.clientId,
    ownerEmployeeId: d.ownerEmployeeId,
    expectedClose: d.expectedClose?.toISOString() ?? null,
    nextStepAt: d.nextStepAt?.toISOString() ?? null,
    closedAt: d.closedAt?.toISOString() ?? null,
    position: d.position.toString(),
    deletedAt: d.deletedAt?.toISOString() ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Pipeline value rollups (for dashboard + sidebar badges)              */
/* ------------------------------------------------------------------ */

export async function pipelineValueRollup(viewer: User, pipelineId?: string) {
  assertCan(viewer, "deals.read");
  const where: Prisma.DealWhereInput = { deletedAt: null, status: "OPEN" };
  if (pipelineId) where.pipelineId = pipelineId;
  const deals = await db.deal.findMany({
    where,
    select: { value: true, probability: true, currency: true, stageId: true },
  });
  let open = 0;
  let expected = 0;
  const byCurrency: Record<string, number> = {};
  for (const d of deals) {
    const v = Number.parseFloat(d.value.toString());
    open += v;
    expected += (v * d.probability) / 100;
    byCurrency[d.currency] = (byCurrency[d.currency] ?? 0) + v;
  }
  return { open, expected, byCurrency, count: deals.length };
}
