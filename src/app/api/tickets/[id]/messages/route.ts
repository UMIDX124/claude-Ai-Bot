import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TicketMessageCreateSchema } from "@/lib/validations/ticket";
import {
  addTicketMessage,
  listTicketMessages,
} from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listTicketMessages(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TicketMessageCreateSchema);
  const m = await addTicketMessage(user, params.id, body, requestMeta(req));
  return NextResponse.json(m, { status: 201 });
});
