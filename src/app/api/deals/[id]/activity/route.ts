import { withApi } from "@/lib/api";
import { listDealActivity } from "@/lib/services/deal.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listDealActivity(user, params.id);
});
