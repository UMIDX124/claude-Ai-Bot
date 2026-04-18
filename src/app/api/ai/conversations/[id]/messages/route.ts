import { NextResponse } from "next/server";
import { parseBody, withApi } from "@/lib/api";
import { AIMessageCreateSchema } from "@/lib/validations/comms";
import { appendMessage } from "@/lib/services/ai.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, AIMessageCreateSchema);
  const m = await appendMessage(user, params.id, body);
  return NextResponse.json(m, { status: 201 });
});
