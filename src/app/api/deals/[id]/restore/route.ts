import { requestMeta, withApi } from "@/lib/api";
import { restoreDeal } from "@/lib/services/deal.service";
import { serializeDeal } from "@/lib/services/deal.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  const restored = await restoreDeal(user, params.id, requestMeta(req));
  return serializeDeal(restored);
});
