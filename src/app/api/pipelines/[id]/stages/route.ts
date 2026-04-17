import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { StageCreateSchema } from "@/lib/validations/deal";
import { createStage } from "@/lib/services/pipeline.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, StageCreateSchema);
  if (body.pipelineId !== params.id) {
    return NextResponse.json(
      { error: "Pipeline ID mismatch" },
      { status: 400 },
    );
  }
  const stage = await createStage(user, body, requestMeta(req));
  return NextResponse.json(stage, { status: 201 });
});
