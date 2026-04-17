"use client";

import Link from "next/link";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { MessageSquare, GitBranch, CheckSquare } from "lucide-react";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";
import type { TaskRow } from "./types";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  compact = false,
  onOpen,
  showStatus = false,
  className,
  draggableProps,
  selected = false,
}: {
  task: TaskRow;
  compact?: boolean;
  showStatus?: boolean;
  onOpen?: (task: TaskRow) => void;
  className?: string;
  draggableProps?: React.HTMLAttributes<HTMLElement> & {
    ref?: (el: HTMLElement | null) => void;
  };
  selected?: boolean;
}) {
  const assigneeName =
    task.assignee?.user.fullName ??
    [task.assignee?.user.firstName, task.assignee?.user.lastName]
      .filter(Boolean)
      .join(" ") ??
    null;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const today = startOfToday();
  const overdue = due && isBefore(due, today) && task.status !== "DONE" && task.status !== "CANCELLED";
  const upcoming = due && isAfter(due, today);

  const content = (
    <article
      {...draggableProps}
      className={cn(
        "group rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 space-y-2 cursor-pointer",
        "hover:border-[#F59E0B]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150",
        selected && "border-[#F59E0B]/70 ring-1 ring-[#F59E0B]/30",
        task.status === "DONE" && "opacity-70",
        task.status === "CANCELLED" && "opacity-50",
        className,
      )}
      onClick={(e) => {
        // If this is a drag handle with our ref, skip click — dnd will handle
        if (onOpen) onOpen(task);
        draggableProps?.onClick?.(e);
      }}
    >
      <header className="flex items-start gap-2">
        <TaskPriorityBadge priority={task.priority} />
        <h4
          className={cn(
            "flex-1 text-sm font-medium leading-snug text-[#FAFAFA] line-clamp-2",
            (task.status === "DONE" || task.status === "CANCELLED") &&
              "line-through decoration-[#71717A]",
          )}
        >
          {task.title}
        </h4>
      </header>

      {task.project && (
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#71717A]"
          title={task.project.name}
        >
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: task.project.color ?? "#F59E0B" }}
          />
          {task.project.code}
        </span>
      )}

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${label.color}22`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-[#71717A]">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <footer className="flex items-center justify-between gap-2 text-[11px] text-[#71717A]">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <EmployeeAvatar
              name={assigneeName}
              url={task.assignee.user.avatarUrl}
              size="sm"
            />
          ) : (
            <span className="inline-flex h-7 w-7 rounded-full border border-dashed border-[#1F1F1F] grid place-items-center text-[10px]">
              ?
            </span>
          )}
          {showStatus && !compact && <TaskStatusBadge status={task.status} />}
        </div>
        <div className="flex items-center gap-2">
          {task._count.subtasks > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <CheckSquare className="h-3 w-3" />
              {task._count.subtasks}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.dependsOn + task._count.blocks > 0 && (
            <span
              className="inline-flex items-center gap-0.5"
              title="Dependencies"
            >
              <GitBranch className="h-3 w-3" />
              {task._count.dependsOn + task._count.blocks}
            </span>
          )}
          {due && (
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                overdue
                  ? "bg-red-500/15 text-red-400"
                  : upcoming
                    ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "bg-[#1F1F1F] text-[#A1A1AA]",
              )}
            >
              {format(due, "MMM d")}
            </span>
          )}
        </div>
      </footer>
    </article>
  );

  if (!onOpen && !draggableProps) {
    return (
      <Link href={`/dashboard/tasks/${task.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 space-y-2">
      <div className="h-3 w-3/4 rounded bg-[#1F1F1F] animate-pulse" />
      <div className="h-2 w-1/3 rounded bg-[#1F1F1F] animate-pulse" />
      <div className="flex justify-between">
        <div className="h-6 w-6 rounded-full bg-[#1F1F1F] animate-pulse" />
        <div className="h-3 w-10 rounded bg-[#1F1F1F] animate-pulse" />
      </div>
    </div>
  );
}
