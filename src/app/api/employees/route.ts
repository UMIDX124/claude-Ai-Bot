import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  EmployeeCreateSchema,
  EmployeeListQuerySchema,
} from "@/lib/validations/employee";
import {
  createEmployee,
  listEmployees,
} from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, EmployeeListQuerySchema);
  return listEmployees(user, query);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, EmployeeCreateSchema);
  const employee = await createEmployee(user, body, requestMeta(req));
  return NextResponse.json(employee, { status: 201 });
});
