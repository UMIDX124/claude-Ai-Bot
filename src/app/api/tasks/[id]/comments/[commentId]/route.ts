import { parseBody, withApi } from "@/lib/api";
import { CommentUpdateSchema } from "@/lib/validations/task";
import {
  deleteComment,
  updateComment,
} from "@/lib/services/task.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, CommentUpdateSchema);
  return updateComment(user, params.id, params.commentId, body);
});

export const DELETE = withApi(async ({ user, params }) => {
  await deleteComment(user, params.id, params.commentId);
  return { ok: true };
});
