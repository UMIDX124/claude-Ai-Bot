import { Prisma } from "@prisma/client";
import type { User, TaskStatus, TaskActivityKind } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, diff as auditDiff } from "@/lib/audit";
import { assertCan, can } from "@/lib/rbac";
import { log } from "@/lib/logger";
import {
  positionBetween,
  appendAfter,
  firstPosition,
} from "@/lib/fractional-index";
import { CycleError, wouldCreateCycle } from "@/lib/dag";
import type {
  BulkActionInput,
  CommentCreateInput,
  CommentUpdateInput,
  DependencyCreateInput,
  SubtaskCreateInput,
  TaskAssignInput,
  TaskCreateInput,
  TaskListQuery,
  TaskMoveInput,
  TaskUpdateInput,
} from "@/lib/validations/task";

export const TASK_INCLUDE = {
  project: { select: { id: true, name: true, code: true, color: true, companyId: true } },
  createdBy: { select: { id: true, email: true, fullName: true, firstName: true, lastName: true } },
  assignee: {
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
  reporter: {
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
  labels: {
    include: { label: true },
  },
  _count: {
    select: {
      subtasks: { where: { deletedAt: null } },
      comments: { where: { deletedAt: null } },
      dependsOn: true,
      blocks: true,
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof TASK_INCLUDE }>;

export type TaskListResult = {
  items: TaskWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listTasks(
  viewer: User,
  query: TaskListQuery,
): Promise<TaskListResult> {
  assertCan(viewer, "tasks.read");

  const where: Prisma.TaskWhereInput = {};
  if (query.onlyDeleted) where.deletedAt = { not: null };
  else if (!query.includeDeleted) where.deletedAt = null;

  if (!query.includeSubtasks) where.parentId = null;
  if (query.projectId?.length) where.projectId = { in: query.projectId };
  if (query.status?.length) where.status = { in: query.status };
  if (query.priority?.length) where.priority = { in: query.priority };
  if (!query.includeCompleted) where.status = { notIn: ["DONE", "CANCELLED"] };

  if (query.assigneeEmployeeId) {
    if (query.assigneeEmployeeId === "me") {
      const meEmp = await employeeFor(viewer);
      where.assigneeEmployeeId = meEmp?.id ?? "__none__";
    } else if (query.assigneeEmployeeId === "unassigned") {
      where.assigneeEmployeeId = null;
    } else if (Array.isArray(query.assigneeEmployeeId)) {
      where.assigneeEmployeeId = { in: query.assigneeEmployeeId };
    } else {
      where.assigneeEmployeeId = query.assigneeEmployeeId;
    }
  }
  if (query.reporterEmployeeId) where.reporterEmployeeId = query.reporterEmployeeId;

  if (query.labelIds?.length) {
    where.labels = { some: { labelId: { in: query.labelIds } } };
  }

  if (query.dueBefore || query.dueAfter) {
    const due: Prisma.DateTimeFilter = {};
    if (query.dueBefore) due.lte = query.dueBefore;
    if (query.dueAfter) due.gte = query.dueAfter;
    where.dueDate = due;
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  const orderBy = parseSort(query.sort);

  const [total, rows] = await db.$transaction([
    db.task.count({ where }),
    db.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function parseSort(
  sort: TaskListQuery["sort"],
): Prisma.TaskOrderByWithRelationInput | Prisma.TaskOrderByWithRelationInput[] {
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const key = sort.replace(/^-/, "");
  switch (key) {
    case "position":
      return [{ position: dir }, { createdAt: "desc" }];
    case "dueDate":
      return { dueDate: { sort: dir, nulls: "last" } };
    case "priority":
      return { priority: dir };
    case "title":
      return { title: dir };
    case "updatedAt":
      return { updatedAt: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function getTask(
  viewer: User,
  id: string,
): Promise<TaskWithRelations | null> {
  assertCan(viewer, "tasks.read");
  return db.task.findUnique({ where: { id }, include: TASK_INCLUDE });
}

export async function createTask(
  actor: User,
  input: TaskCreateInput,
  meta: RequestMeta = {},
): Promise<TaskWithRelations> {
  assertCan(actor, "tasks.create");

  const position = await resolveInitialPosition(input.projectId ?? null, input.status);
  const reporterEmp = input.reporterEmployeeId ? null : await employeeFor(actor);

  const created = await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        projectId: input.projectId ?? null,
        companyId: input.companyId ?? null,
        assigneeEmployeeId: input.assigneeEmployeeId ?? null,
        reporterEmployeeId: input.reporterEmployeeId ?? reporterEmp?.id ?? null,
        createdById: actor.id,
        parentId: input.parentId ?? null,
        dueDate: input.dueDate ?? null,
        startDate: input.startDate ?? null,
        estimatedHours: input.estimatedHours ?? null,
        actualHours: input.actualHours ?? null,
        tags: input.tags,
        position: new Prisma.Decimal(position.toString()),
        ...(input.labelIds?.length
          ? {
              labels: {
                create: input.labelIds.map((labelId) => ({ labelId })),
              },
            }
          : {}),
      },
      include: TASK_INCLUDE,
    });
    await logActivity(tx, task.id, actor.id, "CREATED", {
      title: task.title,
      status: task.status,
    });
    if (input.assigneeEmployeeId) {
      await logActivity(tx, task.id, actor.id, "ASSIGNED", {
        assigneeEmployeeId: input.assigneeEmployeeId,
      });
    }
    return task;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Task",
    resourceId: created.id,
    after: auditShape(created),
    ...meta,
  });
  return created;
}

export async function updateTask(
  actor: User,
  id: string,
  input: TaskUpdateInput,
  meta: RequestMeta = {},
): Promise<TaskWithRelations> {
  const before = await db.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  if (!before) throw statusError(404, "Task not found");
  await assertCanEditTask(actor, before);

  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.estimatedHours !== undefined) data.estimatedHours = input.estimatedHours;
  if (input.actualHours !== undefined) data.actualHours = input.actualHours;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.completedAt !== undefined) data.completedAt = input.completedAt;
  if (input.projectId !== undefined) {
    data.project = input.projectId
      ? { connect: { id: input.projectId } }
      : { disconnect: true };
  }
  if (input.assigneeEmployeeId !== undefined) {
    data.assignee = input.assigneeEmployeeId
      ? { connect: { id: input.assigneeEmployeeId } }
      : { disconnect: true };
  }

  if (input.status === "DONE" && before.status !== "DONE" && input.completedAt === undefined) {
    data.completedAt = new Date();
  } else if (input.status && input.status !== "DONE" && before.completedAt !== null) {
    data.completedAt = null;
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.task.update({ where: { id }, data, include: TASK_INCLUDE });
    if (input.status && input.status !== before.status) {
      await logActivity(tx, id, actor.id, "STATUS_CHANGED", {
        from: before.status,
        to: input.status,
      });
    }
    if (input.priority && input.priority !== before.priority) {
      await logActivity(tx, id, actor.id, "PRIORITY_CHANGED", {
        from: before.priority,
        to: input.priority,
      });
    }
    if (input.assigneeEmployeeId !== undefined && input.assigneeEmployeeId !== before.assigneeEmployeeId) {
      await logActivity(tx, id, actor.id, input.assigneeEmployeeId ? "ASSIGNED" : "UNASSIGNED", {
        from: before.assigneeEmployeeId,
        to: input.assigneeEmployeeId,
      });
    }
    if (input.dueDate !== undefined && !datesEqual(before.dueDate, input.dueDate)) {
      await logActivity(tx, id, actor.id, "DUE_DATE_CHANGED", {
        from: before.dueDate?.toISOString() ?? null,
        to: input.dueDate?.toISOString() ?? null,
      });
    }
    if (input.estimatedHours !== undefined) {
      await logActivity(tx, id, actor.id, "ESTIMATE_CHANGED", {
        to: String(input.estimatedHours),
      });
    }
    return row;
  });

  const changed = auditDiff(auditShape(before), auditShape(updated));
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Task",
    resourceId: id,
    before: changed.before,
    after: changed.after,
    ...meta,
  });

  return updated;
}

export async function moveTask(
  actor: User,
  id: string,
  input: TaskMoveInput,
  meta: RequestMeta = {},
): Promise<TaskWithRelations> {
  const before = await db.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  if (!before) throw statusError(404, "Task not found");
  await assertCanEditTask(actor, before);

  if (input.expectedUpdatedAt) {
    if (before.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
      throw statusError(409, "Position conflict — task was modified elsewhere");
    }
  }

  const [prev, next] = await Promise.all([
    input.prevId
      ? db.task.findUnique({ where: { id: input.prevId }, select: { position: true } })
      : Promise.resolve(null),
    input.nextId
      ? db.task.findUnique({ where: { id: input.nextId }, select: { position: true } })
      : Promise.resolve(null),
  ]);

  const position = positionBetween(prev?.position ?? null, next?.position ?? null);

  const data: Prisma.TaskUpdateInput = {
    status: input.status,
    position: new Prisma.Decimal(position.toString()),
  };
  if (input.status === "DONE" && before.status !== "DONE") {
    data.completedAt = new Date();
  } else if (input.status !== "DONE" && before.completedAt) {
    data.completedAt = null;
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.task.update({ where: { id }, data, include: TASK_INCLUDE });
    await logActivity(tx, id, actor.id, "MOVED", {
      from: before.status,
      to: input.status,
      position: position.toString(),
    });
    if (input.status !== before.status) {
      await logActivity(tx, id, actor.id, "STATUS_CHANGED", {
        from: before.status,
        to: input.status,
      });
    }
    return row;
  });

  await audit({
    actorId: actor.id,
    action: "STATUS_CHANGE",
    resourceType: "Task",
    resourceId: id,
    before: { status: before.status, position: before.position.toString() },
    after: { status: updated.status, position: updated.position.toString() },
    ...meta,
  });
  return updated;
}

export async function assignTask(
  actor: User,
  id: string,
  input: TaskAssignInput,
  meta: RequestMeta = {},
): Promise<TaskWithRelations> {
  const before = await db.task.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Task not found");
  await assertCanEditTask(actor, before);

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.task.update({
      where: { id },
      data: {
        assignee: input.assigneeEmployeeId
          ? { connect: { id: input.assigneeEmployeeId } }
          : { disconnect: true },
      },
      include: TASK_INCLUDE,
    });
    await logActivity(
      tx,
      id,
      actor.id,
      input.assigneeEmployeeId ? "ASSIGNED" : "UNASSIGNED",
      {
        from: before.assigneeEmployeeId,
        to: input.assigneeEmployeeId,
      },
    );
    return row;
  });

  await audit({
    actorId: actor.id,
    action: "ASSIGN",
    resourceType: "Task",
    resourceId: id,
    before: { assigneeEmployeeId: before.assigneeEmployeeId },
    after: { assigneeEmployeeId: input.assigneeEmployeeId },
    ...meta,
  });
  return updated;
}

export async function softDeleteTask(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  const before = await db.task.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Task not found");
  await assertCanDeleteTask(actor, before);

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logActivity(tx, id, actor.id, "DELETED", {});
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Task",
    resourceId: id,
    before: { title: before.title, status: before.status },
    ...meta,
  });
}

export async function restoreTask(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<TaskWithRelations> {
  assertCan(actor, "tasks.restore");
  const before = await db.task.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Task not found");
  const updated = await db.$transaction(async (tx) => {
    const row = await tx.task.update({
      where: { id },
      data: { deletedAt: null },
      include: TASK_INCLUDE,
    });
    await logActivity(tx, id, actor.id, "RESTORED", {});
    return row;
  });
  await audit({
    actorId: actor.id,
    action: "RESTORE",
    resourceType: "Task",
    resourceId: id,
    ...meta,
  });
  return updated;
}

export async function bulkAction(
  actor: User,
  input: BulkActionInput,
  meta: RequestMeta = {},
): Promise<{ affected: number }> {
  assertCan(actor, "tasks.bulk");
  let result: { count: number };
  switch (input.action) {
    case "delete":
      assertCan(actor, "tasks.delete");
      result = await db.task.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      break;
    case "assign":
      assertCan(actor, "tasks.update.any");
      result = await db.task.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { assigneeEmployeeId: input.assigneeEmployeeId },
      });
      break;
    case "updateStatus":
      assertCan(actor, "tasks.update.any");
      result = await db.task.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: {
          status: input.status,
          completedAt: input.status === "DONE" ? new Date() : undefined,
        },
      });
      break;
    case "updatePriority":
      assertCan(actor, "tasks.update.any");
      result = await db.task.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { priority: input.priority },
      });
      break;
  }

  await audit({
    actorId: actor.id,
    action: input.action === "delete" ? "DELETE" : "UPDATE",
    resourceType: "Task",
    metadata: { action: input.action, ids: input.ids, affected: result.count },
    ...meta,
  });

  return { affected: result.count };
}

export async function listComments(viewer: User, taskId: string) {
  assertCan(viewer, "tasks.read");
  return db.taskComment.findMany({
    where: { taskId, deletedAt: null },
    include: {
      author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(
  actor: User,
  taskId: string,
  input: CommentCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "tasks.comment");
  const comment = await db.$transaction(async (tx) => {
    const c = await tx.taskComment.create({
      data: { taskId, authorId: actor.id, content: input.content },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
    });
    await logActivity(tx, taskId, actor.id, "COMMENTED", { commentId: c.id });
    return c;
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "TaskComment",
    resourceId: comment.id,
    metadata: { taskId },
    ...meta,
  });
  return comment;
}

export async function updateComment(
  actor: User,
  taskId: string,
  commentId: string,
  input: CommentUpdateInput,
) {
  const existing = await db.taskComment.findUnique({ where: { id: commentId } });
  if (!existing || existing.taskId !== taskId) {
    throw statusError(404, "Comment not found");
  }
  if (existing.authorId !== actor.id) assertCan(actor, "tasks.update.any");
  return db.taskComment.update({
    where: { id: commentId },
    data: { content: input.content, isEdited: true },
  });
}

export async function deleteComment(
  actor: User,
  taskId: string,
  commentId: string,
) {
  const existing = await db.taskComment.findUnique({ where: { id: commentId } });
  if (!existing || existing.taskId !== taskId) {
    throw statusError(404, "Comment not found");
  }
  if (existing.authorId !== actor.id) assertCan(actor, "tasks.delete.any");
  await db.taskComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
}

export async function listSubtasks(viewer: User, taskId: string) {
  assertCan(viewer, "tasks.read");
  return db.task.findMany({
    where: { parentId: taskId, deletedAt: null },
    include: TASK_INCLUDE,
    orderBy: { position: "asc" },
  });
}

export async function addSubtask(
  actor: User,
  parentTaskId: string,
  input: SubtaskCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "tasks.create");
  const parent = await db.task.findUnique({ where: { id: parentTaskId } });
  if (!parent) throw statusError(404, "Parent task not found");

  const lastSubtask = await db.task.findFirst({
    where: { parentId: parentTaskId, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = appendAfter(lastSubtask?.position ?? null);

  const sub = await db.$transaction(async (tx) => {
    const row = await tx.task.create({
      data: {
        title: input.title,
        parentId: parentTaskId,
        projectId: parent.projectId,
        companyId: parent.companyId,
        createdById: actor.id,
        assigneeEmployeeId: input.assigneeEmployeeId ?? null,
        dueDate: input.dueDate ?? null,
        priority: parent.priority,
        status: "TODO",
        position: new Prisma.Decimal(position.toString()),
      },
      include: TASK_INCLUDE,
    });
    await logActivity(tx, parentTaskId, actor.id, "SUBTASK_ADDED", {
      subtaskId: row.id,
      title: input.title,
    });
    return row;
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Task",
    resourceId: sub.id,
    metadata: { parentTaskId },
    ...meta,
  });
  return sub;
}

export async function toggleSubtask(
  actor: User,
  parentTaskId: string,
  subtaskId: string,
  done: boolean,
  meta: RequestMeta = {},
) {
  const sub = await db.task.findUnique({ where: { id: subtaskId } });
  if (!sub || sub.parentId !== parentTaskId) {
    throw statusError(404, "Subtask not found");
  }
  await assertCanEditTask(actor, sub);
  const updated = await db.$transaction(async (tx) => {
    const row = await tx.task.update({
      where: { id: subtaskId },
      data: {
        status: done ? "DONE" : "TODO",
        completedAt: done ? new Date() : null,
      },
      include: TASK_INCLUDE,
    });
    await logActivity(
      tx,
      parentTaskId,
      actor.id,
      done ? "SUBTASK_COMPLETED" : "REOPENED",
      { subtaskId, title: sub.title },
    );
    return row;
  });
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Task",
    resourceId: subtaskId,
    metadata: { parentTaskId, done },
    ...meta,
  });
  return updated;
}

export async function listDependencies(viewer: User, taskId: string) {
  assertCan(viewer, "tasks.read");
  const [dependsOn, blocks] = await Promise.all([
    db.taskDependency.findMany({
      where: { taskId },
      include: { dependsOnTask: { include: TASK_INCLUDE } },
      orderBy: { createdAt: "asc" },
    }),
    db.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      include: { task: { include: TASK_INCLUDE } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { dependsOn, blocks };
}

export async function addDependency(
  actor: User,
  taskId: string,
  input: DependencyCreateInput,
  meta: RequestMeta = {},
) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw statusError(404, "Task not found");
  await assertCanEditTask(actor, task);

  if (taskId === input.dependsOnTaskId) {
    throw statusError(400, "Task cannot depend on itself");
  }

  const edges = await db.taskDependency.findMany({
    select: { taskId: true, dependsOnTaskId: true },
  });
  const edgeList = edges.map((e) => ({ from: e.taskId, to: e.dependsOnTaskId }));
  if (wouldCreateCycle(edgeList, taskId, input.dependsOnTaskId)) {
    throw statusError(400, "Dependency would create a cycle");
  }

  const dep = await db.$transaction(async (tx) => {
    const row = await tx.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId: input.dependsOnTaskId,
        createdById: actor.id,
      },
    });
    await logActivity(tx, taskId, actor.id, "DEPENDENCY_ADDED", {
      dependsOnTaskId: input.dependsOnTaskId,
    });
    return row;
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "TaskDependency",
    resourceId: dep.id,
    metadata: { taskId, dependsOnTaskId: input.dependsOnTaskId },
    ...meta,
  });
  return dep;
}

export async function removeDependency(
  actor: User,
  taskId: string,
  dependsOnTaskId: string,
  meta: RequestMeta = {},
) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw statusError(404, "Task not found");
  await assertCanEditTask(actor, task);

  await db.$transaction(async (tx) => {
    await tx.taskDependency.deleteMany({
      where: { taskId, dependsOnTaskId },
    });
    await logActivity(tx, taskId, actor.id, "DEPENDENCY_REMOVED", {
      dependsOnTaskId,
    });
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "TaskDependency",
    metadata: { taskId, dependsOnTaskId },
    ...meta,
  });
}

export async function listActivity(viewer: User, taskId: string) {
  assertCan(viewer, "tasks.read");
  return db.taskActivity.findMany({
    where: { taskId },
    include: {
      actor: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function auditShape(t: { id: string; title: string; status: TaskStatus; priority: string; assigneeEmployeeId: string | null; projectId: string | null; dueDate: Date | null; position: Prisma.Decimal | string }) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    assigneeEmployeeId: t.assigneeEmployeeId,
    projectId: t.projectId,
    dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
    position: typeof t.position === "string" ? t.position : t.position.toString(),
  };
}

function datesEqual(a: Date | null, b: Date | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.getTime() === new Date(b).getTime();
}

async function employeeFor(user: User) {
  return db.employee.findUnique({ where: { userId: user.id } });
}

async function resolveInitialPosition(
  projectId: string | null,
  status: TaskStatus,
) {
  const last = await db.task.findFirst({
    where: { projectId, status, parentId: null, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  if (!last) return firstPosition();
  return appendAfter(last.position);
}

async function assertCanEditTask(
  actor: User,
  task: { assigneeEmployeeId: string | null; reporterEmployeeId: string | null; createdById: string; projectId: string | null },
): Promise<void> {
  if (can(actor, "tasks.update.any")) return;
  if (!can(actor, "tasks.update")) {
    throw permissionError("tasks.update");
  }
  // Employee-tier users can only edit their own tasks
  if (task.createdById === actor.id) return;
  const emp = await employeeFor(actor);
  if (emp && (emp.id === task.assigneeEmployeeId || emp.id === task.reporterEmployeeId)) return;
  if (task.projectId) {
    const project = await db.project.findUnique({
      where: { id: task.projectId },
      select: { leadEmployeeId: true },
    });
    if (project?.leadEmployeeId && emp?.id === project.leadEmployeeId) return;
  }
  throw permissionError("tasks.update.any");
}

async function assertCanDeleteTask(
  actor: User,
  task: { createdById: string; projectId: string | null },
): Promise<void> {
  if (can(actor, "tasks.delete.any")) return;
  if (!can(actor, "tasks.delete")) {
    throw permissionError("tasks.delete");
  }
  if (task.createdById === actor.id) return;
  if (task.projectId) {
    const project = await db.project.findUnique({
      where: { id: task.projectId },
      select: { leadEmployeeId: true },
    });
    const emp = await employeeFor(actor);
    if (project?.leadEmployeeId && emp?.id === project.leadEmployeeId) return;
  }
  throw permissionError("tasks.delete.any");
}

function permissionError(perm: string): Error & { status: number } {
  const err = new Error(`Permission denied: ${perm}`) as Error & { status: number };
  err.status = 403;
  return err;
}

async function logActivity(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  kind: TaskActivityKind,
  metadata: Record<string, unknown>,
) {
  try {
    await tx.taskActivity.create({
      data: {
        taskId,
        actorId,
        kind,
        fromValue:
          "from" in metadata && metadata.from != null
            ? String(metadata.from)
            : null,
        toValue:
          "to" in metadata && metadata.to != null ? String(metadata.to) : null,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    log.error("task.activity.fail", err, { taskId, kind });
  }
}

// CycleError type export (Next tree-shakes unused)
export { CycleError };
