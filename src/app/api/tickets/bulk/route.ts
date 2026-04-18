import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TicketBulkActionSchema } from "@/lib/validations/ticket";
import { bulkTicketAction } from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, TicketBulkActionSchema);
  return bulkTicketAction(user, body, requestMeta(req));
});
