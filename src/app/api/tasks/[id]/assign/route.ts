import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TaskAssignSchema } from "@/lib/validations/task";
import { assignTask } from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TaskAssignSchema);
  const task = await assignTask(user, params.id, body, requestMeta(req));
  return serializeTask(task);
});
