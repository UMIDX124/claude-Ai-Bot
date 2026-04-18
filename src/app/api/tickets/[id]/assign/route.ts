import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TicketAssignSchema } from "@/lib/validations/ticket";
import { assignTicket } from "@/lib/services/ticket.service";
import { serializeTicket } from "@/lib/services/ticket.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TicketAssignSchema);
  const t = await assignTicket(user, params.id, body, requestMeta(req));
  return serializeTicket(t);
});
