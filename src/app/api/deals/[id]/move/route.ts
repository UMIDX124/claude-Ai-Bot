import { parseBody, requestMeta, withApi } from "@/lib/api";
import { DealMoveSchema } from "@/lib/validations/deal";
import { moveDeal } from "@/lib/services/deal.service";
import { serializeDeal } from "@/lib/services/deal.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, DealMoveSchema);
  const moved = await moveDeal(user, params.id, body, requestMeta(req));
  return serializeDeal(moved);
});
