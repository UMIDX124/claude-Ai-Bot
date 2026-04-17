import type { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export type AuditInput = {
  actorId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    const data: Prisma.AuditLogCreateInput = {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      ...(input.before !== undefined && input.before !== null
        ? { before: input.before }
        : {}),
      ...(input.after !== undefined && input.after !== null
        ? { after: input.after }
        : {}),
      ...(input.metadata !== undefined && input.metadata !== null
        ? { metadata: input.metadata }
        : {}),
      ...(input.actorId ? { actor: { connect: { id: input.actorId } } } : {}),
    };
    await db.auditLog.create({ data });
  } catch (err) {
    log.error("audit.write.fail", err, {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    });
  }
}

export function diff<T extends Record<string, unknown>>(
  before: T | null | undefined,
  after: T | null | undefined,
): { before: Partial<T>; after: Partial<T> } {
  const b: Partial<T> = {};
  const a: Partial<T> = {};
  if (!before || !after) return { before: before ?? {}, after: after ?? {} };
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      (b as Record<string, unknown>)[k] = before[k];
      (a as Record<string, unknown>)[k] = after[k];
    }
  }
  return { before: b, after: a };
}
