import { withApi } from "@/lib/api";
import { markRoomRead } from "@/lib/services/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ user, params }) => {
  await markRoomRead(user, params.id);
  return { ok: true };
});
