import { z } from "zod";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { EmployeeImportRowSchema } from "@/lib/validations/employee";
import { importCsv } from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  rows: z.array(EmployeeImportRowSchema).min(1).max(500),
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, BodySchema);
  return importCsv(user, body.rows, requestMeta(req));
});
