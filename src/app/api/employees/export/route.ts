import { NextResponse } from "next/server";
import { parseQuery, withApi } from "@/lib/api";
import { EmployeeListQuerySchema } from "@/lib/validations/employee";
import { exportCsv } from "@/lib/services/employee.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, EmployeeListQuerySchema);
  const csv = await exportCsv(user, query);
  const filename = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
});
