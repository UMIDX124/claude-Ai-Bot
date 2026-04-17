import type { Prisma, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import type {
  SlaCreateInput,
  SlaUpdateInput,
} from "@/lib/validations/ticket";

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export async function listSlas(viewer: User) {
  assertCan(viewer, "tickets.read");
  return db.sLA.findMany({
    where: { deletedAt: null },
    orderBy: { responseMinutes: "asc" },
  });
}

export async function createSla(
  actor: User,
  input: SlaCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "slas.manage");
  const sla = await db.sLA.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      responseMinutes: input.responseMinutes,
      resolutionMinutes: input.resolutionMinutes,
      businessHoursOnly: input.businessHoursOnly,
      appliesToPriority: input.appliesToPriority ?? null,
      isActive: input.isActive,
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "SLA",
    resourceId: sla.id,
    after: {
      name: sla.name,
      responseMinutes: sla.responseMinutes,
      resolutionMinutes: sla.resolutionMinutes,
    },
    ...meta,
  });
  return sla;
}

export async function updateSla(
  actor: User,
  id: string,
  input: SlaUpdateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "slas.manage");
  const before = await db.sLA.findUnique({ where: { id } });
  if (!before) throw statusError(404, "SLA not found");
  const data: Prisma.SLAUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.responseMinutes !== undefined) data.responseMinutes = input.responseMinutes;
  if (input.resolutionMinutes !== undefined) data.resolutionMinutes = input.resolutionMinutes;
  if (input.businessHoursOnly !== undefined) data.businessHoursOnly = input.businessHoursOnly;
  if (input.appliesToPriority !== undefined) data.appliesToPriority = input.appliesToPriority;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  const updated = await db.sLA.update({ where: { id }, data });
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "SLA",
    resourceId: id,
    before: { name: before.name, responseMinutes: before.responseMinutes, resolutionMinutes: before.resolutionMinutes },
    after: { name: updated.name, responseMinutes: updated.responseMinutes, resolutionMinutes: updated.resolutionMinutes },
    ...meta,
  });
  return updated;
}

export async function softDeleteSla(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "slas.manage");
  const before = await db.sLA.findUnique({ where: { id } });
  if (!before) throw statusError(404, "SLA not found");
  const inUse = await db.ticket.count({
    where: { slaId: id, deletedAt: null, status: { notIn: ["CLOSED", "RESOLVED"] } },
  });
  if (inUse > 0) {
    throw statusError(400, `SLA is attached to ${inUse} open tickets — reassign before deleting.`);
  }
  await db.sLA.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "SLA",
    resourceId: id,
    before: { name: before.name },
    ...meta,
  });
}
