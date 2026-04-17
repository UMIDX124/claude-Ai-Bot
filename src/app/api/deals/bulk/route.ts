import { parseBody, requestMeta, withApi } from "@/lib/api";
import { DealBulkActionSchema } from "@/lib/validations/deal";
import { bulkDealAction } from "@/lib/services/deal.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, DealBulkActionSchema);
  return bulkDealAction(user, body, requestMeta(req));
});
