import { parseBody, withApi } from "@/lib/api";
import { NotificationPreferenceSchema } from "@/lib/validations/comms";
import {
  getPreferences,
  updatePreferences,
} from "@/lib/services/notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user }) => {
  return getPreferences(user);
});

export const PATCH = withApi(async ({ req, user }) => {
  const body = await parseBody(req, NotificationPreferenceSchema);
  return updatePreferences(user, body);
});
