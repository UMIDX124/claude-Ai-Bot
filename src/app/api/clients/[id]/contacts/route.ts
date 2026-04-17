import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ContactCreateSchema } from "@/lib/validations/client";
import { addContact, listContacts } from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listContacts(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ContactCreateSchema);
  const contact = await addContact(user, params.id, body, requestMeta(req));
  return NextResponse.json(contact, { status: 201 });
});
