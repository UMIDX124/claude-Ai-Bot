import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  TicketCreateSchema,
  TicketListQuerySchema,
} from "@/lib/validations/ticket";
import { createTicket, listTickets } from "@/lib/services/ticket.service";
import {
  serializeTicket,
  serializeTicketList,
} from "@/lib/services/ticket.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, TicketListQuerySchema);
  const result = await listTickets(user, query);
  return serializeTicketList(result);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, TicketCreateSchema);
  const t = await createTicket(user, body, requestMeta(req));
  return NextResponse.json(serializeTicket(t), { status: 201 });
});
