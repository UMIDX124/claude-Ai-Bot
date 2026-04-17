import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TaskMoveSchema } from "@/lib/validations/task";
import { moveTask } from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TaskMoveSchema);
  const task = await moveTask(user, params.id, body, requestMeta(req));
  return serializeTask(task);
});
