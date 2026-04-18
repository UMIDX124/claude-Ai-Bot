import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import { ChatMessageCreateSchema } from "@/lib/validations/comms";
import {
  listMessages,
  sendMessage,
} from "@/lib/services/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  before: z.coerce.date().optional(),
});

export const GET = withApi(async ({ req, user, params }) => {
  const q = parseQuery(req, QuerySchema);
  return listMessages(user, params.id, q);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ChatMessageCreateSchema);
  const m = await sendMessage(user, params.id, body, requestMeta(req));
  return NextResponse.json(m, { status: 201 });
});
