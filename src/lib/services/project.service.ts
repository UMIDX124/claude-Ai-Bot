import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertCan } from "@/lib/rbac";
import type {
  ProjectCreateInput,
  ProjectListQuery,
  ProjectUpdateInput,
} from "@/lib/validations/task";

const PROJECT_INCLUDE = {
  company: { select: { id: true, type: true, name: true } },
  lead: {
    include: {
      user: { select: { firstName: true, lastName: true, fullName: true, email: true } },
    },
  },
  _count: {
    select: {
      tasks: { where: { deletedAt: null } },
      labels: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof PROJECT_INCLUDE;
}>;

export async function listProjects(
  viewer: User,
  query: ProjectListQuery,
): Promise<ProjectWithRelations[]> {
  assertCan(viewer, "projects.read");
  const where: Prisma.ProjectWhereInput = {};
  if (!query.includeDeleted) where.deletedAt = null;
  if (query.companyId) where.companyId = query.companyId;
  if (query.status) where.status = query.status;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }
  return db.project.findMany({
    where,
    include: PROJECT_INCLUDE,
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getProject(
  viewer: User,
  id: string,
): Promise<ProjectWithRelations | null> {
  assertCan(viewer, "projects.read");
  return db.project.findUnique({ where: { id }, include: PROJECT_INCLUDE });
}

export async function createProject(
  actor: User,
  input: ProjectCreateInput,
  meta: RequestMeta = {},
): Promise<ProjectWithRelations> {
  assertCan(actor, "projects.create");
  const created = await db.project.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      status: input.status,
      leadEmployeeId: input.leadEmployeeId ?? null,
      color: input.color ?? null,
      startDate: input.startDate ?? null,
      targetDate: input.targetDate ?? null,
    },
    include: PROJECT_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Project",
    resourceId: created.id,
    after: { name: created.name, code: created.code, companyId: created.companyId },
    ...meta,
  });
  return created;
}

export async function updateProject(
  actor: User,
  id: string,
  input: ProjectUpdateInput,
  meta: RequestMeta = {},
): Promise<ProjectWithRelations> {
  assertCan(actor, "projects.update");
  const before = await db.project.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Project not found");

  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.color !== undefined) data.color = input.color;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.targetDate !== undefined) data.targetDate = input.targetDate;
  if (input.leadEmployeeId !== undefined) {
    data.lead = input.leadEmployeeId
      ? { connect: { id: input.leadEmployeeId } }
      : { disconnect: true };
  }

  const updated = await db.project.update({
    where: { id },
    data,
    include: PROJECT_INCLUDE,
  });

  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Project",
    resourceId: id,
    before: {
      name: before.name,
      status: before.status,
      targetDate: before.targetDate?.toISOString() ?? null,
    },
    after: {
      name: updated.name,
      status: updated.status,
      targetDate: updated.targetDate?.toISOString() ?? null,
    },
    ...meta,
  });

  return updated;
}

export async function softDeleteProject(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "projects.delete");
  const before = await db.project.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Project not found");
  await db.project.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Project",
    resourceId: id,
    before: { name: before.name },
    ...meta,
  });
}

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}
