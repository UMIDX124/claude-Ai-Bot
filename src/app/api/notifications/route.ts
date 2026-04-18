import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  NotificationCreateSchema,
  NotificationListQuerySchema,
} from "@/lib/validations/comms";
import {
  createNotification,
  listNotifications,
} from "@/lib/services/notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const q = parseQuery(req, NotificationListQuerySchema);
  return listNotifications(user, q);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, NotificationCreateSchema);
  const n = await createNotification(user, body, requestMeta(req));
  return NextResponse.json(n, { status: 201 });
});
