import { z } from "zod";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  CompanyTypeEnum,
} from "@/lib/validations/employee";
import { parseBody, parseQuery, requestMeta, withApi } from "@/lib/api";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  company: CompanyTypeEnum.optional(),
  q: z.string().max(200).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

const CreateSchema = z.object({
  companyId: z.string().cuid(),
  kind: z.enum([
    "EXECUTIVE",
    "SALES",
    "MARKETING",
    "ENGINEERING",
    "DESIGN",
    "SUPPORT",
    "HR",
    "FINANCE",
    "OPERATIONS",
    "OTHER",
  ]),
  name: z.string().min(1).max(120),
  code: z.string().max(40).optional().nullable(),
  color: z.string().max(32).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export const GET = withApi(async ({ req, user }) => {
  assertCan(user, "employees.read");
  const q = parseQuery(req, QuerySchema);
  const where: Prisma.DepartmentWhereInput = {};
  if (!q.includeDeleted) where.deletedAt = null;
  if (q.company) where.company = { type: q.company };
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { code: { contains: q.q, mode: "insensitive" } },
    ];
  }
  return db.department.findMany({
    where,
    include: {
      company: { select: { id: true, type: true, name: true } },
      _count: { select: { employees: { where: { deletedAt: null } }, roles: true } },
    },
    orderBy: [{ company: { type: "asc" } }, { name: "asc" }],
  });
});

export const POST = withApi(async ({ req, user }) => {
  assertCan(user, "employees.update");
  const body = await parseBody(req, CreateSchema);
  const dept = await db.department.create({ data: body });
  await audit({
    actorId: user.id,
    action: "CREATE",
    resourceType: "Department",
    resourceId: dept.id,
    after: { name: dept.name, code: dept.code, companyId: dept.companyId },
    ...requestMeta(req),
  });
  return NextResponse.json(dept, { status: 201 });
});
