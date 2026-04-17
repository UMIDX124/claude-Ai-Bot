import { parseBody, requestMeta, withApi } from "@/lib/api";
import { StageUpdateSchema } from "@/lib/validations/deal";
import {
  deleteStage,
  updateStage,
} from "@/lib/services/pipeline.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, StageUpdateSchema);
  return updateStage(user, params.stageId, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await deleteStage(user, params.stageId, requestMeta(req));
  return { ok: true };
});
