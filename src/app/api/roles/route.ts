import { z } from "zod";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  departmentId: z.string().cuid().optional(),
  q: z.string().max(200).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  seniority: z.string().max(40).optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
  permissions: z.array(z.string().max(80)).max(50).default([]),
});

export const GET = withApi(async ({ req, user }) => {
  assertCan(user, "employees.read");
  const q = parseQuery(req, QuerySchema);
  const where: Prisma.RoleWhereInput = {};
  if (!q.includeDeleted) where.deletedAt = null;
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
    ];
  }
  return db.role.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, companyId: true } },
      _count: { select: { employees: { where: { deletedAt: null } } } },
    },
    orderBy: [{ name: "asc" }],
  });
});

export const POST = withApi(async ({ req, user }) => {
  assertCan(user, "employees.update");
  const body = await parseBody(req, CreateSchema);
  const role = await db.role.create({ data: body });
  await audit({
    actorId: user.id,
    action: "CREATE",
    resourceType: "Role",
    resourceId: role.id,
    after: { name: role.name, departmentId: role.departmentId },
    ...requestMeta(req),
  });
  return NextResponse.json(role, { status: 201 });
});
