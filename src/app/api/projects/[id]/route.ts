import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ProjectUpdateSchema } from "@/lib/validations/task";
import {
  getProject,
  softDeleteProject,
  updateProject,
} from "@/lib/services/project.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const project = await getProject(user, params.id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return project;
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ProjectUpdateSchema);
  return updateProject(user, params.id, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeleteProject(user, params.id, requestMeta(req));
  return { ok: true };
});
