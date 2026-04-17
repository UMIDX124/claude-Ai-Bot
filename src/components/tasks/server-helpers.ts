import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { listTasks } from "@/lib/services/task.service";
import { serializeList } from "@/lib/services/task.serialize";
import type {
  Permissions,
  ProjectRow,
  TaskFilters,
  TaskLabelLite,
  TaskListResponse,
  ViewerContext,
} from "./types";
import type { EmployeeRow } from "@/components/employees/types";

export async function loadTaskPageData() {
  const [projects, labels, employees] = await Promise.all([
    loadProjects(),
    loadLabels(),
    loadActiveEmployees(),
  ]);
  return { projects, labels, employees };
}

export async function loadProjects(): Promise<ProjectRow[]> {
  const rows = await db.project.findMany({
    where: { deletedAt: null },
    include: {
      company: { select: { id: true, type: true, name: true } },
      lead: {
        select: {
          id: true,
          employeeCode: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
          labels: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return rows.map((p) => ({
    ...p,
    startDate: p.startDate?.toISOString() ?? null,
    targetDate: p.targetDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
  })) as ProjectRow[];
}

export async function loadLabels(): Promise<TaskLabelLite[]> {
  const rows = await db.taskLabel.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return rows.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    description: l.description,
  }));
}

export async function loadActiveEmployees() {
  const rows = await db.employee.findMany({
    where: { deletedAt: null, status: { not: "TERMINATED" } },
    include: {
      user: true,
      company: true,
      department: true,
      role: true,
      manager: {
        include: {
          user: {
            select: { firstName: true, lastName: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: [{ user: { fullName: "asc" } }],
    take: 200,
  });
  return rows;
}

export function serializedManagers(employees: Awaited<ReturnType<typeof loadActiveEmployees>>): EmployeeRow[] {
  return employees.map((r) => ({
    ...r,
    salary: null,
    salaryVisible: false,
    hireDate: r.hireDate?.toISOString() ?? null,
    probationEndDate: r.probationEndDate?.toISOString() ?? null,
    terminationDate: r.terminationDate?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
  })) as unknown as EmployeeRow[];
}

export function buildPermissions(user: User): Permissions {
  return {
    create: can(user, "tasks.create"),
    update: can(user, "tasks.update"),
    updateAny: can(user, "tasks.update.any"),
    delete: can(user, "tasks.delete"),
    deleteAny: can(user, "tasks.delete.any"),
    restore: can(user, "tasks.restore"),
    bulk: can(user, "tasks.bulk"),
    comment: can(user, "tasks.comment"),
    projectCreate: can(user, "projects.create"),
  };
}

export async function buildViewer(user: User): Promise<ViewerContext> {
  const emp = await db.employee.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  return {
    userId: user.id,
    userRole: user.role,
    employeeId: emp?.id ?? null,
  };
}

export function toTaskListResponse(
  result: Awaited<ReturnType<typeof listTasks>>,
): TaskListResponse {
  return serializeList(result) as unknown as TaskListResponse;
}

export function filtersFromSearchObject(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (k === "view") continue;
    out[k] = v;
  }
  return out;
}

// Re-export TaskFilters type for consumer pages
export type { TaskFilters };
