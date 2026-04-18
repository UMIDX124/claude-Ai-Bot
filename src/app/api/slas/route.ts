import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { SlaCreateSchema } from "@/lib/validations/ticket";
import { createSla, listSlas } from "@/lib/services/sla.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user }) => {
  return listSlas(user);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, SlaCreateSchema);
  const sla = await createSla(user, body, requestMeta(req));
  return NextResponse.json(sla, { status: 201 });
});
