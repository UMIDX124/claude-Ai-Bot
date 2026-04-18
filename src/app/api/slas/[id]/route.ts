import { parseBody, requestMeta, withApi } from "@/lib/api";
import { SlaUpdateSchema } from "@/lib/validations/ticket";
import {
  softDeleteSla,
  updateSla,
} from "@/lib/services/sla.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, SlaUpdateSchema);
  return updateSla(user, params.id, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteSla(user, params.id, requestMeta(req));
  return { ok: true };
});
