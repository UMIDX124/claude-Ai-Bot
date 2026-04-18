import { withApi } from "@/lib/api";
import { getRoom } from "@/lib/services/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return getRoom(user, params.id);
});
