import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  DealCreateSchema,
  DealListQuerySchema,
} from "@/lib/validations/deal";
import { createDeal, listDeals } from "@/lib/services/deal.service";
import {
  serializeDeal,
  serializeDealList,
} from "@/lib/services/deal.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, DealListQuerySchema);
  const result = await listDeals(user, query);
  return serializeDealList(result);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, DealCreateSchema);
  const deal = await createDeal(user, body, requestMeta(req));
  return NextResponse.json(serializeDeal(deal), { status: 201 });
});
