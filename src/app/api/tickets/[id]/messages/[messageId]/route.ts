import { parseBody, withApi } from "@/lib/api";
import { TicketMessageUpdateSchema } from "@/lib/validations/ticket";
import {
  deleteTicketMessage,
  updateTicketMessage,
} from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TicketMessageUpdateSchema);
  return updateTicketMessage(user, params.id, params.messageId, body);
});

export const DELETE = withApi(async ({ user, params }) => {
  await deleteTicketMessage(user, params.id, params.messageId);
  return { ok: true };
});
