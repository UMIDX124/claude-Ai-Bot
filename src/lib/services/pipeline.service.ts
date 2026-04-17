import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import { positionBetween } from "@/lib/fractional-index";
import type {
  PipelineCreateInput,
  PipelineUpdateInput,
  StageCreateInput,
  StageUpdateInput,
} from "@/lib/validations/deal";

const PIPELINE_INCLUDE = {
  company: { select: { id: true, type: true, name: true } },
  stages: {
    where: { deletedAt: null },
    orderBy: { position: "asc" },
  },
  _count: { select: { deals: { where: { deletedAt: null } } } },
} satisfies Prisma.PipelineInclude;

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export async function listPipelines(viewer: User, companyType?: string) {
  assertCan(viewer, "deals.read");
  const where: Prisma.PipelineWhereInput = { deletedAt: null };
  if (companyType) {
    where.company = { type: companyType as never };
  }
  return db.pipeline.findMany({
    where,
    include: PIPELINE_INCLUDE,
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getPipeline(viewer: User, id: string) {
  assertCan(viewer, "deals.read");
  return db.pipeline.findUnique({ where: { id }, include: PIPELINE_INCLUDE });
}

export async function createPipeline(
  actor: User,
  input: PipelineCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");
  let companyId: string | null = null;
  if (input.companyType) {
    const company = await db.company.findUnique({
      where: { type: input.companyType as never },
    });
    if (!company) throw statusError(400, `Unknown company: ${input.companyType}`);
    companyId = company.id;
  }

  const pipeline = await db.pipeline.create({
    data: {
      companyId,
      name: input.name,
      description: input.description ?? null,
      isDefault: input.isDefault,
    },
    include: PIPELINE_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Pipeline",
    resourceId: pipeline.id,
    after: { name: pipeline.name, companyId: pipeline.companyId },
    ...meta,
  });
  return pipeline;
}

export async function updatePipeline(
  actor: User,
  id: string,
  input: PipelineUpdateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");
  const before = await db.pipeline.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Pipeline not found");

  const data: Prisma.PipelineUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;
  if (input.companyType !== undefined) {
    if (input.companyType === null) {
      data.company = { disconnect: true };
    } else {
      const company = await db.company.findUnique({
        where: { type: input.companyType as never },
      });
      if (!company) throw statusError(400, `Unknown company: ${input.companyType}`);
      data.company = { connect: { id: company.id } };
    }
  }

  const updated = await db.pipeline.update({
    where: { id },
    data,
    include: PIPELINE_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Pipeline",
    resourceId: id,
    before: { name: before.name, companyId: before.companyId },
    after: { name: updated.name, companyId: updated.companyId },
    ...meta,
  });
  return updated;
}

export async function softDeletePipeline(
  actor: User,
  id: string,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");
  const before = await db.pipeline.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Pipeline not found");

  const dealCount = await db.deal.count({
    where: { pipelineId: id, deletedAt: null },
  });
  if (dealCount > 0) {
    throw statusError(
      400,
      `Pipeline has ${dealCount} active deals — move or close them first.`,
    );
  }

  await db.pipeline.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Pipeline",
    resourceId: id,
    before: { name: before.name },
    ...meta,
  });
}

/* ------------------------------------------------------------------ */
/* Stages                                                               */
/* ------------------------------------------------------------------ */

export async function createStage(
  actor: User,
  input: StageCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");

  const [prev, next] = await Promise.all([
    input.prevId
      ? db.stage.findUnique({
          where: { id: input.prevId },
          select: { position: true, pipelineId: true },
        })
      : null,
    input.nextId
      ? db.stage.findUnique({
          where: { id: input.nextId },
          select: { position: true, pipelineId: true },
        })
      : null,
  ]);

  let position: Prisma.Decimal;
  if (!prev && !next) {
    const last = await db.stage.findFirst({
      where: { pipelineId: input.pipelineId, deletedAt: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = last
      ? new Prisma.Decimal(positionBetween(last.position, null).toString())
      : new Prisma.Decimal(65536);
  } else {
    position = new Prisma.Decimal(
      positionBetween(prev?.position ?? null, next?.position ?? null).toString(),
    );
  }

  const stage = await db.stage.create({
    data: {
      pipelineId: input.pipelineId,
      name: input.name,
      description: input.description ?? null,
      position,
      probability: input.probability,
      isWon: input.isWon,
      isLost: input.isLost,
      color: input.color ?? null,
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Stage",
    resourceId: stage.id,
    metadata: { pipelineId: input.pipelineId, name: stage.name },
    ...meta,
  });
  return stage;
}

export async function updateStage(
  actor: User,
  stageId: string,
  input: StageUpdateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");
  const before = await db.stage.findUnique({ where: { id: stageId } });
  if (!before) throw statusError(404, "Stage not found");

  const data: Prisma.StageUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.probability !== undefined) data.probability = input.probability;
  if (input.isWon !== undefined) data.isWon = input.isWon;
  if (input.isLost !== undefined) data.isLost = input.isLost;
  if (input.color !== undefined) data.color = input.color;

  if (input.prevId !== undefined || input.nextId !== undefined) {
    const [prev, next] = await Promise.all([
      input.prevId
        ? db.stage.findUnique({
            where: { id: input.prevId },
            select: { position: true },
          })
        : null,
      input.nextId
        ? db.stage.findUnique({
            where: { id: input.nextId },
            select: { position: true },
          })
        : null,
    ]);
    data.position = new Prisma.Decimal(
      positionBetween(prev?.position ?? null, next?.position ?? null).toString(),
    );
  }

  const updated = await db.stage.update({ where: { id: stageId }, data });
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Stage",
    resourceId: stageId,
    before: { name: before.name, probability: before.probability },
    after: { name: updated.name, probability: updated.probability },
    ...meta,
  });
  return updated;
}

export async function deleteStage(
  actor: User,
  stageId: string,
  meta: RequestMeta = {},
) {
  assertCan(actor, "pipelines.manage");
  const before = await db.stage.findUnique({ where: { id: stageId } });
  if (!before) throw statusError(404, "Stage not found");

  const deals = await db.deal.count({
    where: { stageId, deletedAt: null },
  });
  if (deals > 0) {
    throw statusError(
      400,
      `Stage has ${deals} active deals — move them before deleting.`,
    );
  }

  await db.stage.update({
    where: { id: stageId },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Stage",
    resourceId: stageId,
    before: { name: before.name },
    ...meta,
  });
}
