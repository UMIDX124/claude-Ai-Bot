import { NextResponse } from "next/server";
import { parseBody, requestMeta, withApi } from "@/lib/api";
import { ClientNoteCreateSchema } from "@/lib/validations/client";
import {
  addClientNote,
  listClientNotes,
} from "@/lib/services/client.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi(async ({ user, params }) => {
  return listClientNotes(user, params.id);
});

export const POST = withApi(async ({ req, user, params }) => {
  const body = await parseBody(req, ClientNoteCreateSchema);
  const note = await addClientNote(user, params.id, body, requestMeta(req));
  return NextResponse.json(note, { status: 201 });
});
