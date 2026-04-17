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
  | "employees.bulk";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
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
  ],
  ADMIN: [
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
  ],
  MANAGER: [
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.invite",
    "employees.export",
  ],
  EMPLOYEE: ["employees.read"],
  VIEWER: ["employees.read"],
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
