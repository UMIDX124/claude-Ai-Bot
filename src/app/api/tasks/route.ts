import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  TaskCreateSchema,
  TaskListQuerySchema,
} from "@/lib/validations/task";
import { createTask, listTasks } from "@/lib/services/task.service";
import { serializeList } from "@/lib/services/task.serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, TaskListQuerySchema);
  const result = await listTasks(user, query);
  return serializeList(result);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, TaskCreateSchema);
  const task = await createTask(user, body, requestMeta(req));
  return NextResponse.json(task, { status: 201 });
});
