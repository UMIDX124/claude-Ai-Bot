import { parseBody, withApi } from "@/lib/api";
import { NotificationMarkReadSchema } from "@/lib/validations/comms";
import { markRead } from "@/lib/services/notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, NotificationMarkReadSchema);
  return markRead(user, body);
});
