import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ChatRoomCreateSchema } from "@/lib/validations/comms";
import {
  createRoom,
  listRooms,
} from "@/lib/services/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user }) => {
  return listRooms(user);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, ChatRoomCreateSchema);
  const room = await createRoom(user, body, requestMeta(req));
  return NextResponse.json(room, { status: 201 });
});
