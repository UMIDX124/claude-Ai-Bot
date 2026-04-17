import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { TaskUpdateSchema } from "@/lib/validations/task";
import {
  getTask,
  softDeleteTask,
  updateTask,
} from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const task = await getTask(user, params.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return serializeTask(task);
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, TaskUpdateSchema);
  const task = await updateTask(user, params.id, body, requestMeta(req));
  return serializeTask(task);
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteTask(user, params.id, requestMeta(req));
  return { ok: true };
});
