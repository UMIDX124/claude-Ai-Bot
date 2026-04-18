import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import type {
  AIConversationCreateInput,
  AIMessageCreateInput,
} from "@/lib/validations/comms";

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export async function listConversations(viewer: User) {
  assertCan(viewer, "ai.chat");
  return db.aIConversation.findMany({
    where: { userId: viewer.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversation(viewer: User, id: string) {
  assertCan(viewer, "ai.chat");
  const c = await db.aIConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!c || c.userId !== viewer.id) throw statusError(404, "Conversation not found");
  return c;
}

export async function createConversation(
  actor: User,
  input: AIConversationCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "ai.chat");
  const c = await db.aIConversation.create({
    data: {
      userId: actor.id,
      title: input.title ?? null,
      model: input.model ?? null,
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "AIConversation",
    resourceId: c.id,
    ...meta,
  });
  return c;
}

export async function appendMessage(
  actor: User,
  conversationId: string,
  input: AIMessageCreateInput,
) {
  assertCan(actor, "ai.chat");
  const c = await db.aIConversation.findUnique({
    where: { id: conversationId },
  });
  if (!c || c.userId !== actor.id) throw statusError(404, "Conversation not found");
  const msg = await db.aIMessage.create({
    data: {
      conversationId,
      role: input.role,
      content: input.content,
    },
  });
  await db.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return msg;
}

export async function deleteConversation(actor: User, id: string, meta: RequestMeta = {}) {
  assertCan(actor, "ai.chat");
  const c = await db.aIConversation.findUnique({ where: { id } });
  if (!c || c.userId !== actor.id) throw statusError(404, "Conversation not found");
  await db.aIConversation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "AIConversation",
    resourceId: id,
    ...meta,
  });
}
