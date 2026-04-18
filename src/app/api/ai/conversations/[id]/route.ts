import { requestMeta, withApi } from "@/lib/api";
import {
  deleteConversation,
  getConversation,
} from "@/lib/services/ai.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return getConversation(user, params.id);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await deleteConversation(user, params.id, requestMeta(req));
  return { ok: true };
});
