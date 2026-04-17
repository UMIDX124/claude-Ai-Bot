import { requestMeta, withApi } from "@/lib/api";
import { restoreEmployee } from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  return restoreEmployee(user, params.id, requestMeta(req));
});
