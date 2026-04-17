import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { DealUpdateSchema } from "@/lib/validations/deal";
import {
  getDeal,
  softDeleteDeal,
  updateDeal,
} from "@/lib/services/deal.service";
import { serializeDeal } from "@/lib/services/deal.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const deal = await getDeal(user, params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return serializeDeal(deal);
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, DealUpdateSchema);
  const updated = await updateDeal(user, params.id, body, requestMeta(req));
  return serializeDeal(updated);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteDeal(user, params.id, requestMeta(req));
  return { ok: true };
});
