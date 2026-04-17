import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import {
  EmployeeBulkDeleteSchema,
  EmployeeBulkUpdateSchema,
} from "@/lib/validations/employee";
import {
  bulkSoftDelete,
  bulkUpdateEmployees,
} from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("update") }).merge(EmployeeBulkUpdateSchema),
  z.object({ op: z.literal("delete") }).merge(EmployeeBulkDeleteSchema),
]);

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, OpSchema);
  if (body.op === "update") {
    return bulkUpdateEmployees(user, body, requestMeta(req));
  }
  return bulkSoftDelete(user, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user }) => {
  const body = await parseBody(req, EmployeeBulkDeleteSchema);
  const result = await bulkSoftDelete(user, body, requestMeta(req));
  return NextResponse.json(result);
});
