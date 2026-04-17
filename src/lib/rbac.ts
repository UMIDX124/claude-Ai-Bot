import type { User, UserRole } from "@prisma/client";

export type Permission =
  | "employees.read"
  | "employees.read.salary"
  | "employees.create"
  | "employees.update"
  | "employees.update.salary"
  | "employees.delete"
  | "employees.restore"
  | "employees.invite"
  | "employees.import"
  | "employees.export"
  | "employees.bulk"
  | "tasks.read"
  | "tasks.create"
  | "tasks.update"
  | "tasks.update.any"
  | "tasks.delete"
  | "tasks.delete.any"
  | "tasks.restore"
  | "tasks.bulk"
  | "tasks.comment"
  | "projects.read"
  | "projects.create"
  | "projects.update"
  | "projects.delete"
  | "clients.read"
  | "clients.create"
  | "clients.update"
  | "clients.update.any"
  | "clients.delete"
  | "clients.bulk"
  | "clients.export"
  | "deals.read"
  | "deals.create"
  | "deals.update"
  | "deals.update.any"
  | "deals.delete"
  | "deals.bulk"
  | "pipelines.manage";

const ALL_EMPLOYEE: Permission[] = [
  "employees.read",
  "employees.read.salary",
  "employees.create",
  "employees.update",
  "employees.update.salary",
  "employees.delete",
  "employees.restore",
  "employees.invite",
  "employees.import",
  "employees.export",
  "employees.bulk",
];

const ALL_TASKS: Permission[] = [
  "tasks.read",
  "tasks.create",
  "tasks.update",
  "tasks.update.any",
  "tasks.delete",
  "tasks.delete.any",
  "tasks.restore",
  "tasks.bulk",
  "tasks.comment",
];

const ALL_PROJECTS: Permission[] = [
  "projects.read",
  "projects.create",
  "projects.update",
  "projects.delete",
];

const ALL_CLIENTS: Permission[] = [
  "clients.read",
  "clients.create",
  "clients.update",
  "clients.update.any",
  "clients.delete",
  "clients.bulk",
  "clients.export",
];

const ALL_DEALS: Permission[] = [
  "deals.read",
  "deals.create",
  "deals.update",
  "deals.update.any",
  "deals.delete",
  "deals.bulk",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    ...ALL_EMPLOYEE,
    ...ALL_TASKS,
    ...ALL_PROJECTS,
    ...ALL_CLIENTS,
    ...ALL_DEALS,
    "pipelines.manage",
  ],
  ADMIN: [
    ...ALL_EMPLOYEE,
    ...ALL_TASKS,
    ...ALL_PROJECTS,
    ...ALL_CLIENTS,
    ...ALL_DEALS,
    "pipelines.manage",
  ],
  MANAGER: [
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.invite",
    "employees.export",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.update.any",
    "tasks.delete",
    "tasks.restore",
    "tasks.bulk",
    "tasks.comment",
    "projects.read",
    "projects.create",
    "projects.update",
    "clients.read",
    "clients.create",
    "clients.update",
    "clients.update.any",
    "clients.delete",
    "clients.bulk",
    "clients.export",
    "deals.read",
    "deals.create",
    "deals.update",
    "deals.update.any",
    "deals.delete",
    "deals.bulk",
  ],
  EMPLOYEE: [
    "employees.read",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.comment",
    "projects.read",
    "clients.read",
    "clients.create",
    "clients.update",
    "clients.export",
    "deals.read",
    "deals.create",
    "deals.update",
  ],
  VIEWER: [
    "employees.read",
    "tasks.read",
    "projects.read",
    "clients.read",
    "deals.read",
  ],
};

export function can(user: Pick<User, "role">, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

export function assertCan(user: Pick<User, "role">, permission: Permission): void {
  if (!can(user, permission)) {
    const err: Error & { status?: number } = new Error(
      `Permission denied: ${permission}`,
    );
    err.status = 403;
    throw err;
  }
}

export function canViewSalary(user: Pick<User, "role">): boolean {
  return can(user, "employees.read.salary");
}

export function canEditSalary(user: Pick<User, "role">): boolean {
  return can(user, "employees.update.salary");
}
