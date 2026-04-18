import { withApi } from "@/lib/api";
import { listTicketActivity } from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listTicketActivity(user, params.id);
});
