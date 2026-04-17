import { requestMeta, withApi } from "@/lib/api";
import { deleteClientNote } from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withApi(async ({ req, user, params }) => {
  await deleteClientNote(user, params.id, params.noteId, requestMeta(req));
  return { ok: true };
});
