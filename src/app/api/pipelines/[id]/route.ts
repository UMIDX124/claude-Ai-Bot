import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { PipelineUpdateSchema } from "@/lib/validations/deal";
import {
  getPipeline,
  softDeletePipeline,
  updatePipeline,
} from "@/lib/services/pipeline.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  const p = await getPipeline(user, params.id);
  if (!p) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  return p;
});

export const PATCH = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, PipelineUpdateSchema);
  return updatePipeline(user, params.id, body, requestMeta(req));
});

export const DELETE = withApi(async ({ req, user, params }) => {
  await softDeletePipeline(user, params.id, requestMeta(req));
  return { ok: true };
});
