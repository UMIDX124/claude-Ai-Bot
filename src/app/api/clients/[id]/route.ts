import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ClientUpdateSchema } from "@/lib/validations/client";
import {
  getClient,
  softDeleteClient,
  updateClient,
} from "@/lib/services/client.service";
import { serializeClient } from "@/lib/services/client.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const client = await getClient(user, params.id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return serializeClient(client);
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ClientUpdateSchema);
  const updated = await updateClient(user, params.id, body, requestMeta(req));
  return serializeClient(updated);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteClient(user, params.id, requestMeta(req));
  return { ok: true };
});
