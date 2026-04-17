import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  ClientCreateSchema,
  ClientListQuerySchema,
} from "@/lib/validations/client";
import { createClient, listClients } from "@/lib/services/client.service";
import {
  serializeClient,
  serializeClientList,
} from "@/lib/services/client.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, ClientListQuerySchema);
  const result = await listClients(user, query);
  return serializeClientList(result);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, ClientCreateSchema);
  const client = await createClient(user, body, requestMeta(req));
  return NextResponse.json(serializeClient(client), { status: 201 });
});
