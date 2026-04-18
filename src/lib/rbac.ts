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
  | "pipelines.manage"
  | "tickets.read"
  | "tickets.create"
  | "tickets.update"
  | "tickets.update.any"
  | "tickets.delete"
  | "tickets.bulk"
  | "tickets.reply"
  | "tickets.reply.internal"
  | "slas.manage"
  | "notifications.read.own"
  | "notifications.send.any"
  | "chat.read"
  | "chat.send"
  | "chat.rooms.create"
  | "chat.rooms.manage"
  | "ai.chat";

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

const ALL_TICKETS: Permission[] = [
  "tickets.read",
  "tickets.create",
  "tickets.update",
  "tickets.update.any",
  "tickets.delete",
  "tickets.bulk",
  "tickets.reply",
  "tickets.reply.internal",
];

const ALL_COMMS: Permission[] = [
  "notifications.read.own",
  "notifications.send.any",
  "chat.read",
  "chat.send",
  "chat.rooms.create",
  "chat.rooms.manage",
  "ai.chat",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    ...ALL_EMPLOYEE,
    ...ALL_TASKS,
    ...ALL_PROJECTS,
    ...ALL_CLIENTS,
    ...ALL_DEALS,
    ...ALL_TICKETS,
    ...ALL_COMMS,
    "pipelines.manage",
    "slas.manage",
  ],
  ADMIN: [
    ...ALL_EMPLOYEE,
    ...ALL_TASKS,
    ...ALL_PROJECTS,
    ...ALL_CLIENTS,
    ...ALL_DEALS,
    ...ALL_TICKETS,
    ...ALL_COMMS,
    "pipelines.manage",
    "slas.manage",
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
    "tickets.read",
    "tickets.create",
    "tickets.update",
    "tickets.update.any",
    "tickets.delete",
    "tickets.bulk",
    "tickets.reply",
    "tickets.reply.internal",
    "notifications.read.own",
    "chat.read",
    "chat.send",
    "chat.rooms.create",
    "ai.chat",
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
    "tickets.read",
    "tickets.create",
    "tickets.update",
    "tickets.reply",
    "notifications.read.own",
    "chat.read",
    "chat.send",
    "ai.chat",
  ],
  VIEWER: [
    "employees.read",
    "tasks.read",
    "projects.read",
    "clients.read",
    "deals.read",
    "tickets.read",
    "notifications.read.own",
    "chat.read",
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
