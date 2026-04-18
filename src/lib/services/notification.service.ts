import type { Prisma, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import type {
  NotificationCreateInput,
  NotificationListQuery,
  NotificationMarkReadInput,
  NotificationPreferenceInput,
} from "@/lib/validations/comms";

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

export async function listNotifications(viewer: User, query: NotificationListQuery) {
  assertCan(viewer, "notifications.read.own");
  const where: Prisma.NotificationWhereInput = { userId: viewer.id };
  if (typeof query.isRead === "boolean") where.isRead = query.isRead;
  if (query.kind?.length) where.kind = { in: query.kind };
  if (query.before) where.createdAt = { lt: query.before };

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
    }),
    db.notification.count({ where: { userId: viewer.id, isRead: false } }),
  ]);
  return { items, unreadCount };
}

export async function markRead(
  viewer: User,
  input: NotificationMarkReadInput,
): Promise<{ marked: number }> {
  assertCan(viewer, "notifications.read.own");
  const now = new Date();
  if (input.all) {
    const res = await db.notification.updateMany({
      where: { userId: viewer.id, isRead: false },
      data: { isRead: true, readAt: now },
    });
    return { marked: res.count };
  }
  if (!input.ids?.length) return { marked: 0 };
  const res = await db.notification.updateMany({
    where: { userId: viewer.id, id: { in: input.ids } },
    data: { isRead: true, readAt: now },
  });
  return { marked: res.count };
}

export async function createNotification(
  actor: User,
  input: NotificationCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "notifications.send.any");
  const n = await db.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      channel: input.channel,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Notification",
    resourceId: n.id,
    metadata: { userId: input.userId, kind: input.kind },
    ...meta,
  });
  return n;
}

export async function getPreferences(viewer: User) {
  assertCan(viewer, "notifications.read.own");
  const pref = await db.notificationPreference.findUnique({
    where: { userId: viewer.id },
  });
  if (pref) return pref;
  return db.notificationPreference.create({
    data: { userId: viewer.id },
  });
}

export async function updatePreferences(
  viewer: User,
  input: NotificationPreferenceInput,
) {
  assertCan(viewer, "notifications.read.own");
  return db.notificationPreference.upsert({
    where: { userId: viewer.id },
    update: input,
    create: { userId: viewer.id, ...input },
  });
}
