"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "./types";

export function SubtaskChecklist({
  taskId,
  subtasks,
  onRefresh,
  canEdit,
}: {
  taskId: string;
  subtasks: TaskRow[];
  onRefresh: () => Promise<void> | void;
  canEdit: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setNewTitle("");
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(sub: TaskRow, done: boolean) {
    await fetch(`/api/tasks/${taskId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done }),
    });
    await onRefresh();
  }

  async function remove(sub: TaskRow) {
    await fetch(`/api/tasks/${taskId}/subtasks/${sub.id}`, { method: "DELETE" });
    await onRefresh();
  }

  const doneCount = subtasks.filter((s) => s.status === "DONE").length;

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between text-xs text-[#A1A1AA]">
        <span>
          <span className="text-[#FAFAFA] font-medium">
            {doneCount} / {subtasks.length}
          </span>{" "}
          complete
        </span>
        {subtasks.length > 0 && (
          <div className="flex-1 mx-3 h-1 rounded-full bg-[#1F1F1F] overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] transition-all"
              style={{
                width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        )}
      </header>

      <ul className="space-y-1">
        {subtasks.map((sub) => {
          const done = sub.status === "DONE";
          return (
            <li
              key={sub.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#161616]"
            >
              <Checkbox
                checked={done}
                onCheckedChange={(v) => canEdit && toggle(sub, Boolean(v))}
                disabled={!canEdit}
              />
              <span
                className={`flex-1 text-sm ${done ? "line-through text-[#71717A]" : "text-[#FAFAFA]"}`}
              >
                {sub.title}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(sub)}
                  className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-red-400"
                  aria-label="Delete subtask"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add();
              }
            }}
          />
          <Button type="button" size="sm" onClick={add} disabled={busy}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
