import { requestMeta, withApi } from "@/lib/api";
import { restoreClient } from "@/lib/services/client.service";
import { serializeClient } from "@/lib/services/client.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  const restored = await restoreClient(user, params.id, requestMeta(req));
  return serializeClient(restored);
});
