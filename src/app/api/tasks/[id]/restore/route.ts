import { requestMeta, withApi } from "@/lib/api";
import { restoreTask } from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  const task = await restoreTask(user, params.id, requestMeta(req));
  return serializeTask(task);
});
