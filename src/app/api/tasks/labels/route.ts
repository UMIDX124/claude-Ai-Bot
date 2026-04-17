import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import { LabelCreateSchema } from "@/lib/validations/task";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  companyId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
});

export const GET = withApi(async ({ req, user }) => {
  assertCan(user, "tasks.read");
  const q = parseQuery(req, QuerySchema);
  const where: Prisma.TaskLabelWhereInput = { deletedAt: null };
  if (q.companyId) where.companyId = q.companyId;
  if (q.projectId) where.projectId = q.projectId;
  return db.taskLabel.findMany({ where, orderBy: { name: "asc" } });
});

export const POST = withApi(async ({ req, user }) => {
  assertCan(user, "tasks.update");
  const body = await parseBody(req, LabelCreateSchema);
  const label = await db.taskLabel.create({
    data: {
      companyId: body.companyId,
      projectId: body.projectId ?? null,
      name: body.name,
      color: body.color,
      description: body.description ?? null,
    },
  });
  await audit({
    actorId: user.id,
    action: "CREATE",
    resourceType: "TaskLabel",
    resourceId: label.id,
    metadata: { name: label.name },
    ...requestMeta(req),
  });
  return NextResponse.json(label, { status: 201 });
});
