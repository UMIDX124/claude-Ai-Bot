import { NextResponse } from "next/server";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import {
  ProjectCreateSchema,
  ProjectListQuerySchema,
} from "@/lib/validations/task";
import {
  createProject,
  listProjects,
} from "@/lib/services/project.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req, user }) => {
  const query = parseQuery(req, ProjectListQuerySchema);
  return listProjects(user, query);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, ProjectCreateSchema);
  const project = await createProject(user, body, requestMeta(req));
  return NextResponse.json(project, { status: 201 });
});
