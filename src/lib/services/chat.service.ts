import type { Prisma, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import type {
  ChatMessageCreateInput,
  ChatRoomCreateInput,
} from "@/lib/validations/comms";

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

const ROOM_INCLUDE = {
  members: {
    include: {
      user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
  },
  _count: {
    select: { messages: { where: { deletedAt: null } } },
  },
} satisfies Prisma.ChatRoomInclude;

export async function listRooms(viewer: User) {
  assertCan(viewer, "chat.read");
  const rooms = await db.chatRoom.findMany({
    where: {
      deletedAt: null,
      members: { some: { userId: viewer.id } },
    },
    include: ROOM_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  return rooms;
}

export async function getRoom(viewer: User, roomId: string) {
  assertCan(viewer, "chat.read");
  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: ROOM_INCLUDE,
  });
  if (!room) throw statusError(404, "Room not found");
  const isMember = room.members.some((m) => m.userId === viewer.id);
  if (!isMember) throw statusError(403, "Not a member of this room");
  return room;
}

export async function createRoom(
  actor: User,
  input: ChatRoomCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "chat.rooms.create");
  const memberIds = Array.from(new Set([...input.memberIds, actor.id]));
  const room = await db.chatRoom.create({
    data: {
      kind: input.kind,
      name: input.name ?? null,
      description: input.description ?? null,
      clientId: input.clientId ?? null,
      ticketId: input.ticketId ?? null,
      members: { create: memberIds.map((userId) => ({ userId })) },
    },
    include: ROOM_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "ChatRoom",
    resourceId: room.id,
    metadata: { kind: input.kind, memberCount: memberIds.length },
    ...meta,
  });
  return room;
}

export async function listMessages(
  viewer: User,
  roomId: string,
  opts: { limit?: number; before?: Date } = {},
) {
  assertCan(viewer, "chat.read");
  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: viewer.id } },
  });
  if (!member) throw statusError(403, "Not a member of this room");

  const where: Prisma.MessageWhereInput = { roomId, deletedAt: null };
  if (opts.before) where.createdAt = { lt: opts.before };

  return db.message.findMany({
    where,
    include: {
      author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: opts.limit ?? 100,
  });
}

export async function sendMessage(
  actor: User,
  roomId: string,
  input: ChatMessageCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "chat.send");
  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: actor.id } },
  });
  if (!member) throw statusError(403, "Not a member of this room");

  const msg = await db.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        room: { connect: { id: roomId } },
        author: { connect: { id: actor.id } },
        kind: input.kind,
        content: input.content,
        ...(input.replyToId
          ? { replyTo: { connect: { id: input.replyToId } } }
          : {}),
      },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
    });
    await tx.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });
    await tx.chatMember.update({
      where: { roomId_userId: { roomId, userId: actor.id } },
      data: { lastReadAt: new Date() },
    });
    return m;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Message",
    resourceId: msg.id,
    metadata: { roomId },
    ...meta,
  });
  return msg;
}

export async function markRoomRead(viewer: User, roomId: string) {
  assertCan(viewer, "chat.read");
  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: viewer.id } },
  });
  if (!member) throw statusError(403, "Not a member of this room");
  await db.chatMember.update({
    where: { roomId_userId: { roomId, userId: viewer.id } },
    data: { lastReadAt: new Date() },
  });
}
