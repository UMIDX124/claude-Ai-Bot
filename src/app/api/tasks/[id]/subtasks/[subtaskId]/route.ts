import { parseBody, requestMeta, withApi } from "@/lib/api";
import { SubtaskToggleSchema } from "@/lib/validations/task";
import {
  softDeleteTask,
  toggleSubtask,
} from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, SubtaskToggleSchema);
  const sub = await toggleSubtask(
    user,
    params.id,
    params.subtaskId,
    body.done,
    requestMeta(req),
  );
  return serializeTask(sub);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteTask(user, params.subtaskId, requestMeta(req));
  return { ok: true };
});
