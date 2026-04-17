import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { SubtaskCreateSchema } from "@/lib/validations/task";
import {
  addSubtask,
  listSubtasks,
} from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const rows = await listSubtasks(user, params.id);
  return rows.map(serializeTask);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, SubtaskCreateSchema);
  const sub = await addSubtask(user, params.id, body, requestMeta(req));
  return NextResponse.json(serializeTask(sub), { status: 201 });
});
