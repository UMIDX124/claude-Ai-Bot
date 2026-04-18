import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { AIConversationCreateSchema } from "@/lib/validations/comms";
import {
  createConversation,
  listConversations,
} from "@/lib/services/ai.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user }) => {
  return listConversations(user);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, AIConversationCreateSchema);
  const c = await createConversation(user, body, requestMeta(req));
  return NextResponse.json(c, { status: 201 });
});
