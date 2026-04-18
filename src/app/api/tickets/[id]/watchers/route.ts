import { parseBody, withApi } from "@/lib/api";
import { TicketWatcherSchema } from "@/lib/validations/ticket";
import {
  addWatcher,
  listWatchers,
} from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listWatchers(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TicketWatcherSchema);
  await addWatcher(user, params.id, body);
  return { ok: true };
});
