import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ContactUpdateSchema } from "@/lib/validations/client";
import {
  deleteContact,
  updateContact,
} from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ContactUpdateSchema);
  return updateContact(user, params.id, params.contactId, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await deleteContact(user, params.id, params.contactId, requestMeta(req));
  return { ok: true };
});
