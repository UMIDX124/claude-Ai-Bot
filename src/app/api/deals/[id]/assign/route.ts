import { parseBody, requestMeta, withApi } from "@/lib/api";
import { DealAssignSchema } from "@/lib/validations/deal";
import { assignDeal } from "@/lib/services/deal.service";
import { serializeDeal } from "@/lib/services/deal.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, DealAssignSchema);
  const updated = await assignDeal(user, params.id, body, requestMeta(req));
  return serializeDeal(updated);
});
