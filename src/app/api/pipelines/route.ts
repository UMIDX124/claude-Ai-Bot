import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import { PipelineCreateSchema } from "@/lib/validations/deal";
import {
  createPipeline,
  listPipelines,
} from "@/lib/services/pipeline.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  companyType: z.enum(["DPL", "VCS", "BSL"]).optional(),
});

export const GET = withApi(async ({ req, user }) => {
  const q = parseQuery(req, QuerySchema);
  return listPipelines(user, q.companyType);
});

export const POST = withApi(async ({ req, user }) => {
  const body = await parseBody(req, PipelineCreateSchema);
  const pipeline = await createPipeline(user, body, requestMeta(req));
  return NextResponse.json(pipeline, { status: 201 });
});
