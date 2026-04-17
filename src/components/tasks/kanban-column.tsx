"use client";

import type { TaskStatus } from "@prisma/client";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./task-status-badge";
import type { TaskRow } from "./types";
import type { ReactNode } from "react";

export function KanbanColumn({
  status,
  tasks,
  children,
  onAdd,
}: {
  status: TaskStatus;
  tasks: TaskRow[];
  children: ReactNode;
  onAdd?: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  const meta = STATUS_META[status];

  return (
    <section
      ref={setNodeRef}
      data-status={status}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] transition-colors",
        isOver && "border-[#F59E0B]/50 bg-[#F59E0B]/5",
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#A1A1AA]">
            {meta.label}
          </h3>
          <span className="text-[10px] text-[#71717A] bg-[#1F1F1F] rounded-full px-1.5 py-0.5">
            {tasks.length}
          </span>
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(status)}
            className="text-[18px] leading-none text-[#71717A] hover:text-[#F59E0B]"
            aria-label={`Add task to ${meta.label}`}
            title="Add task"
          >
            +
          </button>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {children}
      </div>
    </section>
  );
}
