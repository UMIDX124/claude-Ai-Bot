import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { DependencyCreateSchema } from "@/lib/validations/task";
import {
  addDependency,
  listDependencies,
  removeDependency,
} from "@/lib/services/task.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listDependencies(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, DependencyCreateSchema);
  const dep = await addDependency(user, params.id, body, requestMeta(req));
  return NextResponse.json(dep, { status: 201 });
});

const DeleteSchema = z.object({ dependsOnTaskId: z.string().cuid() });

export const DELETE = withApi(async ({ req, user, params }) => {
  const url = req.nextUrl;
  const dependsOnTaskId =
    url.searchParams.get("dependsOnTaskId") ??
    (await req.json().catch(() => null as unknown))?.["dependsOnTaskId"];
  const parsed = DeleteSchema.parse({ dependsOnTaskId });
  await removeDependency(user, params.id, parsed.dependsOnTaskId, requestMeta(req));
  return { ok: true };
});
