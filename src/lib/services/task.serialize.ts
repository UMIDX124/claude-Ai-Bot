import { Prisma } from "@prisma/client";
import type {
  TaskListResult,
  TaskWithRelations,
} from "@/lib/services/task.service";

export type SerializedTask = Omit<
  TaskWithRelations,
  "position" | "estimatedHours" | "actualHours" | "dueDate" | "startDate" | "startedAt" | "completedAt" | "createdAt" | "updatedAt" | "deletedAt"
> & {
  position: string;
  estimatedHours: string | null;
  actualHours: string | null;
  dueDate: string | null;
  startDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function serializeTask(task: TaskWithRelations): SerializedTask {
  return {
    ...task,
    position: task.position.toString(),
    estimatedHours: decToString(task.estimatedHours),
    actualHours: decToString(task.actualHours),
    dueDate: dateToIso(task.dueDate),
    startDate: dateToIso(task.startDate),
    startedAt: dateToIso(task.startedAt),
    completedAt: dateToIso(task.completedAt),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deletedAt: dateToIso(task.deletedAt),
  } as SerializedTask;
}

export function serializeList(result: TaskListResult) {
  return {
    ...result,
    items: result.items.map(serializeTask),
  };
}

function decToString(d: Prisma.Decimal | null | undefined): string | null {
  if (d == null) return null;
  return d.toString();
}

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}
