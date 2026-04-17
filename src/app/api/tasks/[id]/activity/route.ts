import { withApi } from "@/lib/api";
import { listActivity } from "@/lib/services/task.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listActivity(user, params.id);
});
