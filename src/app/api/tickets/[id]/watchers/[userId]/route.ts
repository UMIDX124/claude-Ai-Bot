import { withApi } from "@/lib/api";
import { removeWatcher } from "@/lib/services/ticket.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withApi(async ({ user, params }) => {
  await removeWatcher(user, params.id, params.userId);
  return { ok: true };
});
