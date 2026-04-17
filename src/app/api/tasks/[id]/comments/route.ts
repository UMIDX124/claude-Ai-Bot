import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { CommentCreateSchema } from "@/lib/validations/task";
import { addComment, listComments } from "@/lib/services/task.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listComments(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, CommentCreateSchema);
  const comment = await addComment(user, params.id, body, requestMeta(req));
  return NextResponse.json(comment, { status: 201 });
});
