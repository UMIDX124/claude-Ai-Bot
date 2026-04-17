import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ClientBulkActionSchema } from "@/lib/validations/client";
import { bulkClientAction } from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, ClientBulkActionSchema);
  return bulkClientAction(user, body, requestMeta(req));
});
