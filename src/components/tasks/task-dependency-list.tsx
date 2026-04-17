"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskStatusBadge } from "./task-status-badge";
import type { TaskRow } from "./types";

export function TaskDependencyList({
  taskId,
  dependsOn,
  blocks,
  allTasks,
  onRefresh,
  canEdit,
}: {
  taskId: string;
  dependsOn: Array<{ id: string; dependsOnTask: TaskRow }>;
  blocks: Array<{ id: string; task: TaskRow }>;
  allTasks: TaskRow[];
  onRefresh: () => Promise<void> | void;
  canEdit: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  async function add(dependsOnTaskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dependsOnTaskId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed" }));
      alert(body.error ?? "Failed to add dependency");
      return;
    }
    setAdding(false);
    setQuery("");
    await onRefresh();
  }

  async function remove(dependsOnTaskId: string) {
    await fetch(
      `/api/tasks/${taskId}/dependencies?dependsOnTaskId=${dependsOnTaskId}`,
      { method: "DELETE" },
    );
    await onRefresh();
  }

  const candidates = query.trim()
    ? allTasks
        .filter(
          (t) =>
            t.id !== taskId &&
            !dependsOn.some((d) => d.dependsOnTask.id === t.id) &&
            t.title.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-5">
      <Section title="Depends on" count={dependsOn.length}>
        {dependsOn.length === 0 ? (
          <p className="text-sm text-[#71717A]">Nothing blocks this task.</p>
        ) : (
          <ul className="space-y-1">
            {dependsOn.map(({ id, dependsOnTask }) => (
              <DepRow
                key={id}
                task={dependsOnTask}
                onRemove={canEdit ? () => remove(dependsOnTask.id) : undefined}
              />
            ))}
          </ul>
        )}
        {canEdit && !adding && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdding(true)}
            className="mt-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add dependency
          </Button>
        )}
        {canEdit && adding && (
          <div className="mt-3 space-y-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks to depend on…"
              onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
            />
            <ul className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] divide-y divide-[#1F1F1F]">
              {candidates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#161616] flex items-center justify-between gap-2"
                    onClick={() => add(t.id)}
                  >
                    <span className="truncate">{t.title}</span>
                    <TaskStatusBadge status={t.status} />
                  </button>
                </li>
              ))}
              {candidates.length === 0 && (
                <li className="px-3 py-2 text-xs text-[#71717A]">
                  {query.trim() ? "No matches" : "Start typing…"}
                </li>
              )}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Blocks" count={blocks.length}>
        {blocks.length === 0 ? (
          <p className="text-sm text-[#71717A]">This task doesn't block anything.</p>
        ) : (
          <ul className="space-y-1">
            {blocks.map(({ id, task }) => (
              <DepRow key={id} task={task} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
        {title} · {count}
      </h4>
      {children}
    </section>
  );
}

function DepRow({
  task,
  onRemove,
}: {
  task: TaskRow;
  onRemove?: () => void;
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2">
      <Link
        href={`/dashboard/tasks/${task.id}`}
        className="flex-1 text-sm text-[#FAFAFA] hover:text-[#F59E0B] truncate"
      >
        {task.title}
      </Link>
      <TaskStatusBadge status={task.status} />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-red-400"
          aria-label="Remove dependency"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
