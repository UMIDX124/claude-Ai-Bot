import { Prisma } from "@prisma/client";
import type { TicketStatus, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, diff as auditDiff } from "@/lib/audit";
import { assertCan, can } from "@/lib/rbac";
import { log } from "@/lib/logger";
import type {
  TicketAssignInput,
  TicketBulkActionInput,
  TicketCreateInput,
  TicketListQuery,
  TicketMessageCreateInput,
  TicketMessageUpdateInput,
  TicketMoveStatusInput,
  TicketUpdateInput,
  TicketWatcherInput,
} from "@/lib/validations/ticket";

export const TICKET_INCLUDE = {
  company: { select: { id: true, type: true, name: true } },
  client: {
    select: { id: true, name: true, logoUrl: true, accountTier: true },
  },
  reporter: {
    select: { id: true, email: true, fullName: true, avatarUrl: true },
  },
  assignedTo: {
    select: { id: true, email: true, fullName: true, avatarUrl: true },
  },
  assigneeEmployee: {
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
  sla: {
    select: {
      id: true,
      name: true,
      responseMinutes: true,
      resolutionMinutes: true,
    },
  },
  watchers: {
    include: {
      user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
  },
  _count: {
    select: {
      messages: { where: { deletedAt: null } },
      activities: true,
      watchers: true,
    },
  },
} satisfies Prisma.TicketInclude;

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: typeof TICKET_INCLUDE;
}>;

export type TicketListResult = {
  items: TicketWithRelations[];
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
  const c = await db.company.findUnique({
    where: { type: companyType as never },
  });
  if (!c) throw statusError(400, `Unknown company: ${companyType}`);
  return c.id;
}

export async function listTickets(
  viewer: User,
  query: TicketListQuery,
): Promise<TicketListResult> {
  assertCan(viewer, "tickets.read");

  const where: Prisma.TicketWhereInput = {};
  if (query.onlyDeleted) where.deletedAt = { not: null };
  else if (!query.includeDeleted) where.deletedAt = null;

  if (query.company?.length) where.company = { type: { in: query.company } };
  if (query.status?.length) where.status = { in: query.status };
  if (query.priority?.length) where.priority = { in: query.priority };
  if (query.channel?.length) where.channel = { in: query.channel };
  if (query.clientId) where.clientId = query.clientId;
  if (query.reporterId) where.reporterId = query.reporterId;
  if (!query.includeClosed) {
    where.status = where.status ?? { notIn: ["CLOSED", "RESOLVED"] };
  }

  if (query.assigneeEmployeeId) {
    if (query.assigneeEmployeeId === "me") {
      const emp = await db.employee.findUnique({
        where: { userId: viewer.id },
        select: { id: true },
      });
      where.assigneeEmployeeId = emp?.id ?? "__none__";
    } else if (query.assigneeEmployeeId === "unassigned") {
      where.assigneeEmployeeId = null;
    } else {
      where.assigneeEmployeeId = query.assigneeEmployeeId;
    }
  }

  if (query.slaBreaching) {
    where.OR = [
      { responseBreachedAt: { not: null } },
      { resolutionBreachedAt: { not: null } },
    ];
  }

  if (query.q) {
    const search: Prisma.TicketWhereInput = {
      OR: [
        { subject: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { category: { contains: query.q, mode: "insensitive" } },
      ],
    };
    where.AND = where.AND ? [where.AND, search].flat() : [search];
  }

  const orderBy = parseSort(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await db.$transaction([
    db.ticket.count({ where }),
    db.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
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
  sort: TicketListQuery["sort"],
): Prisma.TicketOrderByWithRelationInput | Prisma.TicketOrderByWithRelationInput[] {
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const key = sort.replace(/^-/, "");
  switch (key) {
    case "updatedAt":
      return { updatedAt: dir };
    case "priority":
      return { priority: dir };
    case "responseDueAt":
      return { responseDueAt: { sort: dir, nulls: "last" } };
    case "resolutionDueAt":
      return { resolutionDueAt: { sort: dir, nulls: "last" } };
    case "number":
      return { number: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function getTicket(viewer: User, id: string) {
  assertCan(viewer, "tickets.read");
  return db.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
}

export async function getTicketByNumber(viewer: User, number: number) {
  assertCan(viewer, "tickets.read");
  return db.ticket.findUnique({ where: { number }, include: TICKET_INCLUDE });
}

async function resolveSla(priority: string, explicitSlaId?: string | null) {
  if (explicitSlaId) {
    return db.sLA.findUnique({ where: { id: explicitSlaId } });
  }
  const sla = await db.sLA.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      appliesToPriority: priority as never,
    },
  });
  if (sla) return sla;
  return db.sLA.findFirst({
    where: { isActive: true, deletedAt: null, appliesToPriority: null },
  });
}

export async function createTicket(
  actor: User,
  input: TicketCreateInput,
  meta: RequestMeta = {},
): Promise<TicketWithRelations> {
  assertCan(actor, "tickets.create");
  const companyId = await resolveCompanyId(input.companyType);
  const sla = await resolveSla(input.priority, input.slaId);
  const now = new Date();
  const responseDueAt = sla
    ? new Date(now.getTime() + sla.responseMinutes * 60_000)
    : null;
  const resolutionDueAt = sla
    ? new Date(now.getTime() + sla.resolutionMinutes * 60_000)
    : null;

  const created = await db.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        companyId,
        clientId: input.clientId ?? null,
        reporterId: actor.id,
        assigneeEmployeeId: input.assigneeEmployeeId ?? null,
        slaId: sla?.id ?? null,
        subject: input.subject,
        description: input.description,
        status: input.status,
        priority: input.priority,
        channel: input.channel,
        category: input.category ?? null,
        tags: input.tags,
        dueAt: input.dueAt ?? null,
        responseDueAt,
        resolutionDueAt,
      },
      include: TICKET_INCLUDE,
    });
    await tx.ticketActivity.create({
      data: {
        ticketId: t.id,
        actorId: actor.id,
        kind: "CREATED",
        toValue: t.status,
      },
    });
    return t;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Ticket",
    resourceId: created.id,
    after: auditShape(created),
    ...meta,
  });
  return created;
}

export async function updateTicket(
  actor: User,
  id: string,
  input: TicketUpdateInput,
  meta: RequestMeta = {},
): Promise<TicketWithRelations> {
  const before = await db.ticket.findUnique({
    where: { id },
    include: TICKET_INCLUDE,
  });
  if (!before) throw statusError(404, "Ticket not found");
  await assertCanEditTicket(actor, before);

  const data: Prisma.TicketUpdateInput = {};
  if (input.subject !== undefined) data.subject = input.subject;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.channel !== undefined) data.channel = input.channel;
  if (input.category !== undefined) data.category = input.category;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;
  if (input.satisfactionScore !== undefined) data.satisfactionScore = input.satisfactionScore;
  if (input.satisfactionComment !== undefined) data.satisfactionComment = input.satisfactionComment;
  if (input.resolvedAt !== undefined) data.resolvedAt = input.resolvedAt;
  if (input.closedAt !== undefined) data.closedAt = input.closedAt;
  if (input.clientId !== undefined) {
    data.client = input.clientId
      ? { connect: { id: input.clientId } }
      : { disconnect: true };
  }
  if (input.assigneeEmployeeId !== undefined) {
    data.assigneeEmployee = input.assigneeEmployeeId
      ? { connect: { id: input.assigneeEmployeeId } }
      : { disconnect: true };
  }
  if (input.slaId !== undefined) {
    data.sla = input.slaId
      ? { connect: { id: input.slaId } }
      : { disconnect: true };
  }

  // If priority changed, recompute SLA due times (only if tracking SLA)
  if (
    input.priority !== undefined &&
    input.priority !== before.priority &&
    before.slaId
  ) {
    const sla = await resolveSla(input.priority);
    if (sla) {
      const base = before.createdAt;
      data.responseDueAt = new Date(
        base.getTime() + sla.responseMinutes * 60_000,
      );
      data.resolutionDueAt = new Date(
        base.getTime() + sla.resolutionMinutes * 60_000,
      );
      data.sla = { connect: { id: sla.id } };
    }
  }

  if (input.status === "RESOLVED" && !before.resolvedAt) {
    data.resolvedAt = new Date();
  }
  if (input.status === "CLOSED" && !before.closedAt) {
    data.closedAt = new Date();
    if (!before.resolvedAt) data.resolvedAt = new Date();
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.ticket.update({
      where: { id },
      data,
      include: TICKET_INCLUDE,
    });
    if (input.status && input.status !== before.status) {
      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: actor.id,
          kind: "STATUS_CHANGED",
          fromValue: before.status,
          toValue: input.status,
        },
      });
    }
    if (input.priority && input.priority !== before.priority) {
      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: actor.id,
          kind: "PRIORITY_CHANGED",
          fromValue: before.priority,
          toValue: input.priority,
        },
      });
    }
    return row;
  });

  const changed = auditDiff(auditShape(before), auditShape(updated));
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Ticket",
    resourceId: id,
    before: changed.before,
    after: changed.after,
    ...meta,
  });
  return updated;
}

export async function moveTicketStatus(
  actor: User,
  id: string,
  input: TicketMoveStatusInput,
  meta: RequestMeta = {},
): Promise<TicketWithRelations> {
  return updateTicket(
    actor,
    id,
    {
      status: input.status,
    },
    meta,
  );
}

export async function assignTicket(
  actor: User,
  id: string,
  input: TicketAssignInput,
  meta: RequestMeta = {},
): Promise<TicketWithRelations> {
  const before = await db.ticket.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Ticket not found");
  await assertCanEditTicket(actor, before);

  const employeeUser = input.assigneeEmployeeId
    ? await db.employee.findUnique({
        where: { id: input.assigneeEmployeeId },
        select: { userId: true },
      })
    : null;

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.ticket.update({
      where: { id },
      data: {
        assigneeEmployee: input.assigneeEmployeeId
          ? { connect: { id: input.assigneeEmployeeId } }
          : { disconnect: true },
        assignedTo: employeeUser
          ? { connect: { id: employeeUser.userId } }
          : { disconnect: true },
      },
      include: TICKET_INCLUDE,
    });
    await tx.ticketActivity.create({
      data: {
        ticketId: id,
        actorId: actor.id,
        kind: "ASSIGNED",
        fromValue: before.assigneeEmployeeId,
        toValue: input.assigneeEmployeeId,
      },
    });
    return row;
  });

  await audit({
    actorId: actor.id,
    action: "ASSIGN",
    resourceType: "Ticket",
    resourceId: id,
    before: { assigneeEmployeeId: before.assigneeEmployeeId },
    after: { assigneeEmployeeId: input.assigneeEmployeeId },
    ...meta,
  });
  return updated;
}

export async function softDeleteTicket(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "tickets.delete");
  const before = await db.ticket.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Ticket not found");
  await db.ticket.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Ticket",
    resourceId: id,
    before: { subject: before.subject, status: before.status },
    ...meta,
  });
}

export async function bulkTicketAction(
  actor: User,
  input: TicketBulkActionInput,
  meta: RequestMeta = {},
): Promise<{ affected: number }> {
  assertCan(actor, "tickets.bulk");
  let result: { count: number };
  switch (input.action) {
    case "delete":
      assertCan(actor, "tickets.delete");
      result = await db.ticket.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      break;
    case "assign": {
      assertCan(actor, "tickets.update.any");
      const empUser = input.assigneeEmployeeId
        ? await db.employee.findUnique({
            where: { id: input.assigneeEmployeeId },
            select: { userId: true },
          })
        : null;
      result = await db.ticket.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: {
          assigneeEmployeeId: input.assigneeEmployeeId,
          assignedToId: empUser?.userId ?? null,
        },
      });
      break;
    }
    case "updateStatus":
      assertCan(actor, "tickets.update.any");
      result = await db.ticket.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: {
          status: input.status,
          ...(input.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
          ...(input.status === "CLOSED"
            ? { closedAt: new Date(), resolvedAt: new Date() }
            : {}),
        },
      });
      break;
    case "updatePriority":
      assertCan(actor, "tickets.update.any");
      result = await db.ticket.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { priority: input.priority },
      });
      break;
  }
  await audit({
    actorId: actor.id,
    action: input.action === "delete" ? "DELETE" : "UPDATE",
    resourceType: "Ticket",
    metadata: { action: input.action, ids: input.ids, affected: result.count },
    ...meta,
  });
  return { affected: result.count };
}

/* ------------------------------------------------------------------ */
/* Messages                                                              */
/* ------------------------------------------------------------------ */

export async function listTicketMessages(viewer: User, ticketId: string) {
  assertCan(viewer, "tickets.read");
  return db.ticketMessage.findMany({
    where: { ticketId, deletedAt: null },
    include: {
      author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTicketMessage(
  actor: User,
  ticketId: string,
  input: TicketMessageCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "tickets.reply");
  if (input.isInternal) assertCan(actor, "tickets.reply.internal");

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw statusError(404, "Ticket not found");

  const isFirstResponse = !ticket.firstResponseAt && actor.id !== ticket.reporterId;

  const msg = await db.$transaction(async (tx) => {
    const m = await tx.ticketMessage.create({
      data: {
        ticket: { connect: { id: ticketId } },
        author: { connect: { id: actor.id } },
        content: input.content,
        isInternal: input.isInternal,
      },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
    });
    if (isFirstResponse) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          firstResponseAt: new Date(),
          acknowledgedAt: ticket.acknowledgedAt ?? new Date(),
          status: ticket.status === "OPEN" ? "ACKNOWLEDGED" : ticket.status,
        },
      });
    }
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        kind: input.isInternal ? "INTERNAL_NOTE" : "REPLY",
        metadata: { messageId: m.id },
      },
    });
    return m;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "TicketMessage",
    resourceId: msg.id,
    metadata: { ticketId, isInternal: input.isInternal },
    ...meta,
  });
  return msg;
}

export async function updateTicketMessage(
  actor: User,
  ticketId: string,
  messageId: string,
  input: TicketMessageUpdateInput,
) {
  const existing = await db.ticketMessage.findUnique({
    where: { id: messageId },
  });
  if (!existing || existing.ticketId !== ticketId) {
    throw statusError(404, "Message not found");
  }
  if (existing.authorId !== actor.id) assertCan(actor, "tickets.update.any");
  return db.ticketMessage.update({
    where: { id: messageId },
    data: { content: input.content },
  });
}

export async function deleteTicketMessage(
  actor: User,
  ticketId: string,
  messageId: string,
) {
  const existing = await db.ticketMessage.findUnique({
    where: { id: messageId },
  });
  if (!existing || existing.ticketId !== ticketId) {
    throw statusError(404, "Message not found");
  }
  if (existing.authorId !== actor.id) assertCan(actor, "tickets.update.any");
  await db.ticketMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });
}

/* ------------------------------------------------------------------ */
/* Watchers                                                              */
/* ------------------------------------------------------------------ */

export async function listWatchers(viewer: User, ticketId: string) {
  assertCan(viewer, "tickets.read");
  return db.ticketWatcher.findMany({
    where: { ticketId },
    include: {
      user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addWatcher(
  actor: User,
  ticketId: string,
  input: TicketWatcherInput,
) {
  assertCan(actor, "tickets.update");
  await db.ticketWatcher.upsert({
    where: { ticketId_userId: { ticketId, userId: input.userId } },
    update: {},
    create: { ticketId, userId: input.userId },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "TicketWatcher",
    metadata: { ticketId, userId: input.userId },
  });
}

export async function removeWatcher(
  actor: User,
  ticketId: string,
  userId: string,
) {
  assertCan(actor, "tickets.update");
  await db.ticketWatcher.deleteMany({
    where: { ticketId, userId },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "TicketWatcher",
    metadata: { ticketId, userId },
  });
}

/* ------------------------------------------------------------------ */
/* Activity                                                              */
/* ------------------------------------------------------------------ */

export async function listTicketActivity(viewer: User, ticketId: string) {
  assertCan(viewer, "tickets.read");
  return db.ticketActivity.findMany({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard / sidebar rollups                                           */
/* ------------------------------------------------------------------ */

export async function ticketRollups() {
  const now = new Date();
  const [open, breaching, avgResponse, closedThisWeek] = await Promise.all([
    db.ticket.count({
      where: { deletedAt: null, status: { notIn: ["CLOSED", "RESOLVED"] } },
    }),
    db.ticket.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CLOSED", "RESOLVED"] },
        OR: [
          { responseDueAt: { lt: now }, firstResponseAt: null },
          { resolutionDueAt: { lt: now }, resolvedAt: null },
        ],
      },
    }),
    db.ticket.findMany({
      where: {
        deletedAt: null,
        firstResponseAt: { not: null },
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 3600_000) },
      },
      select: { createdAt: true, firstResponseAt: true },
    }),
    db.ticket.count({
      where: {
        deletedAt: null,
        closedAt: {
          gte: new Date(now.getTime() - 7 * 24 * 3600_000),
        },
      },
    }),
  ]);

  let avgResponseMinutes: number | null = null;
  if (avgResponse.length > 0) {
    const sum = avgResponse.reduce(
      (a, t) =>
        a +
        ((t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60_000),
      0,
    );
    avgResponseMinutes = Math.round(sum / avgResponse.length);
  }

  return { open, breaching, avgResponseMinutes, closedThisWeek };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

async function assertCanEditTicket(
  actor: User,
  ticket: {
    assigneeEmployeeId: string | null;
    assignedToId: string | null;
    reporterId: string;
  },
): Promise<void> {
  if (can(actor, "tickets.update.any")) return;
  if (!can(actor, "tickets.update")) {
    throw permissionError("tickets.update");
  }
  if (ticket.assignedToId === actor.id) return;
  if (ticket.reporterId === actor.id) return;
  const emp = await db.employee.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (emp && emp.id === ticket.assigneeEmployeeId) return;
  throw permissionError("tickets.update.any");
}

function permissionError(perm: string): Error & { status: number } {
  const err = new Error(`Permission denied: ${perm}`) as Error & { status: number };
  err.status = 403;
  return err;
}

function auditShape(t: TicketWithRelations) {
  return {
    id: t.id,
    number: t.number,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    channel: t.channel,
    assigneeEmployeeId: t.assigneeEmployeeId,
    slaId: t.slaId,
    responseDueAt: t.responseDueAt?.toISOString() ?? null,
    resolutionDueAt: t.resolutionDueAt?.toISOString() ?? null,
    firstResponseAt: t.firstResponseAt?.toISOString() ?? null,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    closedAt: t.closedAt?.toISOString() ?? null,
    satisfactionScore: t.satisfactionScore,
    deletedAt: t.deletedAt?.toISOString() ?? null,
  };
}

// Helper exposed for tests / nightly job: mark breached tickets.
export async function recomputeBreaches(): Promise<{ responseMarked: number; resolutionMarked: number }> {
  const now = new Date();
  const [r1, r2] = await Promise.all([
    db.ticket.updateMany({
      where: {
        deletedAt: null,
        firstResponseAt: null,
        responseBreachedAt: null,
        responseDueAt: { lt: now },
      },
      data: { responseBreachedAt: now },
    }),
    db.ticket.updateMany({
      where: {
        deletedAt: null,
        resolvedAt: null,
        resolutionBreachedAt: null,
        resolutionDueAt: { lt: now },
      },
      data: { resolutionBreachedAt: now },
    }),
  ]);
  log.info("ticket.breaches.recomputed", {
    responseMarked: r1.count,
    resolutionMarked: r2.count,
  });
  return { responseMarked: r1.count, resolutionMarked: r2.count };
}

// Status transition map — used for client-side validation and activity consistency
export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "CLOSED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["OPEN"],
};
