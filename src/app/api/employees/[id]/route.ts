import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { EmployeeUpdateSchema } from "@/lib/validations/employee";
import {
  getEmployee,
  softDeleteEmployee,
  updateEmployee,
} from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const employee = await getEmployee(user, params.id);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  return employee;
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, EmployeeUpdateSchema);
  return updateEmployee(user, params.id, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  const reason = req.nextUrl.searchParams.get("reason") ?? undefined;
  return softDeleteEmployee(user, params.id, { ...requestMeta(req), reason });
});
