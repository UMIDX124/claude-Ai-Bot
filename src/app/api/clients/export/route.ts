import { NextResponse } from "next/server";
import { parseQuery, withApi } from "@/lib/api";
import { ClientListQuerySchema } from "@/lib/validations/client";
import { exportClientsCsv } from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, ClientListQuerySchema);
  const csv = await exportClientsCsv(user, query);
  const filename = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
});
