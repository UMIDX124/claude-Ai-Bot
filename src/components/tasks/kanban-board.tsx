"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskStatus } from "@prisma/client";
import { TASK_STATUS_ORDER } from "@/lib/validations/task";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import type { TaskRow } from "./types";

export function KanbanBoard({
  tasks,
  onTaskClick,
  onMove,
  onAdd,
}: {
  tasks: TaskRow[];
  onTaskClick?: (task: TaskRow) => void;
  onMove: (args: {
    taskId: string;
    status: TaskStatus;
    prevId: string | null;
    nextId: string | null;
    expectedUpdatedAt: string;
  }) => Promise<void> | void;
  onAdd?: (status: TaskStatus) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => groupByStatus(tasks), [tasks]);
  const active = activeId ? tasks.find((t) => t.id === activeId) : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === a.id);
    if (!activeTask) return;

    let targetStatus: TaskStatus;
    let overTaskId: string | null = null;

    const overId = String(over.id);
    if (overId.startsWith("col-")) {
      targetStatus = overId.slice(4) as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      overTaskId = overTask.id;
    }

    const columnTasks = byStatus[targetStatus] ?? [];
    const targetColumn = columnTasks.filter((t) => t.id !== activeTask.id);
    const overIndex = overTaskId
      ? targetColumn.findIndex((t) => t.id === overTaskId)
      : targetColumn.length;

    const prevId = overIndex > 0 ? targetColumn[overIndex - 1]?.id ?? null : null;
    const nextId =
      overIndex >= 0 && overIndex < targetColumn.length
        ? targetColumn[overIndex]?.id ?? null
        : null;

    // No-op: same column, same position
    if (
      activeTask.status === targetStatus &&
      byStatus[targetStatus]?.[overIndex]?.id === activeTask.id
    ) {
      return;
    }

    await onMove({
      taskId: activeTask.id,
      status: targetStatus,
      prevId,
      nextId,
      expectedUpdatedAt: activeTask.updatedAt,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUS_ORDER.map((status) => {
          const items = byStatus[status] ?? [];
          return (
            <KanbanColumn
              key={status}
              status={status}
              tasks={items}
              onAdd={onAdd}
            >
              <SortableContext
                items={items.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onOpen={onTaskClick}
                  />
                ))}
                {items.length === 0 && (
                  <div className="h-16 rounded-md border border-dashed border-[#1F1F1F] grid place-items-center text-[11px] text-[#52525B]">
                    Drop here
                  </div>
                )}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {active ? <TaskCard task={active} onOpen={() => undefined} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableTaskCard({
  task,
  onOpen,
}: {
  task: TaskRow;
  onOpen?: (task: TaskRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <TaskCard
      task={task}
      onOpen={onOpen}
      draggableProps={{
        ref: setNodeRef,
        style,
        ...attributes,
        ...listeners,
      }}
    />
  );
}

function groupByStatus(tasks: TaskRow[]): Record<TaskStatus, TaskRow[]> {
  const groups: Record<TaskStatus, TaskRow[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    BLOCKED: [],
    DONE: [],
    CANCELLED: [],
  };
  for (const t of tasks) {
    groups[t.status].push(t);
  }
  for (const key of Object.keys(groups) as TaskStatus[]) {
    groups[key].sort((a, b) => {
      const ap = Number.parseFloat(a.position);
      const bp = Number.parseFloat(b.position);
      return ap - bp;
    });
  }
  return groups;
}
