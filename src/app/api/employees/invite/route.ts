import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { EmployeeInviteSchema } from "@/lib/validations/employee";
import { inviteEmployee } from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, EmployeeInviteSchema);
  const employee = await inviteEmployee(user, body, requestMeta(req));
  return NextResponse.json(employee, { status: 201 });
});
