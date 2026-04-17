import { z } from "zod";
import { TaskPriority, TaskStatus, ProjectStatus } from "@prisma/client";

export const TaskStatusEnum = z.nativeEnum(TaskStatus);
export const TaskPriorityEnum = z.nativeEnum(TaskPriority);
export const ProjectStatusEnum = z.nativeEnum(ProjectStatus);

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
];

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional().nullable(),
  status: TaskStatusEnum.default("TODO"),
  priority: TaskPriorityEnum.default("MEDIUM"),
  projectId: z.string().cuid().optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  assigneeEmployeeId: z.string().cuid().optional().nullable(),
  reporterEmployeeId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  estimatedHours: z.coerce.number().nonnegative().max(100_000).optional().nullable(),
  actualHours: z.coerce.number().nonnegative().max(100_000).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  labelIds: z.array(z.string().cuid()).max(20).default([]),
  position: z.union([z.string(), z.number()]).optional(),
});
export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  completedAt: z.coerce.date().optional().nullable(),
});
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

export const TaskMoveSchema = z.object({
  status: TaskStatusEnum,
  prevId: z.string().cuid().optional().nullable(),
  nextId: z.string().cuid().optional().nullable(),
  expectedUpdatedAt: z.coerce.date().optional(),
});
export type TaskMoveInput = z.infer<typeof TaskMoveSchema>;

export const TaskAssignSchema = z.object({
  assigneeEmployeeId: z.string().cuid().nullable(),
});
export type TaskAssignInput = z.infer<typeof TaskAssignSchema>;

export const TaskListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  projectId: z
    .union([z.string().cuid(), z.array(z.string().cuid())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  status: z
    .union([TaskStatusEnum, z.array(TaskStatusEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  priority: z
    .union([TaskPriorityEnum, z.array(TaskPriorityEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  assigneeEmployeeId: z
    .union([z.string().cuid(), z.array(z.string().cuid()), z.literal("me"), z.literal("unassigned")])
    .optional(),
  reporterEmployeeId: z.string().cuid().optional(),
  labelIds: z
    .union([z.string().cuid(), z.array(z.string().cuid())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  includeCompleted: z.coerce.boolean().default(true),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  includeSubtasks: z.coerce.boolean().default(false),
  sort: z
    .enum([
      "position",
      "-position",
      "dueDate",
      "-dueDate",
      "priority",
      "-priority",
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "title",
      "-title",
    ])
    .default("position"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;

export const BulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().cuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("assign"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    assigneeEmployeeId: z.string().cuid().nullable(),
  }),
  z.object({
    action: z.literal("updateStatus"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    status: TaskStatusEnum,
  }),
  z.object({
    action: z.literal("updatePriority"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    priority: TaskPriorityEnum,
  }),
]);
export type BulkActionInput = z.infer<typeof BulkActionSchema>;

export const CommentCreateSchema = z.object({
  content: z.string().min(1).max(10_000),
});
export const CommentUpdateSchema = z.object({
  content: z.string().min(1).max(10_000),
});
export type CommentCreateInput = z.infer<typeof CommentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof CommentUpdateSchema>;

export const SubtaskCreateSchema = z.object({
  title: z.string().min(1).max(300),
  assigneeEmployeeId: z.string().cuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});
export const SubtaskToggleSchema = z.object({
  done: z.boolean(),
});
export type SubtaskCreateInput = z.infer<typeof SubtaskCreateSchema>;

export const DependencyCreateSchema = z.object({
  dependsOnTaskId: z.string().cuid(),
});
export type DependencyCreateInput = z.infer<typeof DependencyCreateSchema>;

export const LabelCreateSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#F59E0B"),
  description: z.string().max(400).optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  companyId: z.string().cuid(),
});
export type LabelCreateInput = z.infer<typeof LabelCreateSchema>;

export const ProjectCreateSchema = z.object({
  companyId: z.string().cuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40).regex(/^[A-Z0-9-]+$/, "CODE must be uppercase letters, numbers, or dashes"),
  description: z.string().max(2000).optional().nullable(),
  status: ProjectStatusEnum.default("ACTIVE"),
  leadEmployeeId: z.string().cuid().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
});
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;

export const ProjectUpdateSchema = ProjectCreateSchema.partial();
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

export const ProjectListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  companyId: z.string().cuid().optional(),
  status: ProjectStatusEnum.optional(),
  includeDeleted: z.coerce.boolean().default(false),
});
export type ProjectListQuery = z.infer<typeof ProjectListQuerySchema>;
