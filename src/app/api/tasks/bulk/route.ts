import { parseBody, requestMeta, withApi } from "@/lib/api";
import { BulkActionSchema } from "@/lib/validations/task";
import { bulkAction } from "@/lib/services/task.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, BulkActionSchema);
  return bulkAction(user, body, requestMeta(req));
});
