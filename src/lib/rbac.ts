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
  | "projects.delete";

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

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [...ALL_EMPLOYEE, ...ALL_TASKS, ...ALL_PROJECTS],
  ADMIN: [...ALL_EMPLOYEE, ...ALL_TASKS, ...ALL_PROJECTS],
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
  ],
  EMPLOYEE: [
    "employees.read",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "tasks.comment",
    "projects.read",
  ],
  VIEWER: ["employees.read", "tasks.read", "projects.read"],
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
