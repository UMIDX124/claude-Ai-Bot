import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TicketUpdateSchema } from "@/lib/validations/ticket";
import {
  getTicket,
  softDeleteTicket,
  updateTicket,
} from "@/lib/services/ticket.service";
import { serializeTicket } from "@/lib/services/ticket.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const t = await getTicket(user, params.id);
  if (!t) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return serializeTicket(t);
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TicketUpdateSchema);
  const t = await updateTicket(user, params.id, body, requestMeta(req));
  return serializeTicket(t);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteTicket(user, params.id, requestMeta(req));
  return { ok: true };
});
