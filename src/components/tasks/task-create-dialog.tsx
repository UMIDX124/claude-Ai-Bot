"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskStatus, TaskPriority } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_META } from "./task-status-badge";
import { PRIORITY_META } from "./task-priority-badge";
import { TaskAssigneePicker } from "./task-assignee-picker";
import type {
  ProjectRow,
  TaskLabelLite,
  TaskRow,
} from "./types";
import type { EmployeeRow } from "@/components/employees/types";

const STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type Values = {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeEmployeeId: string | null;
  dueDate: string;
};

export function TaskCreateDialog({
  open,
  onOpenChange,
  projects,
  employees,
  labels: _labels,
  defaultStatus,
  defaultProjectId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: ProjectRow[];
  employees: EmployeeRow[];
  labels: TaskLabelLite[];
  defaultStatus?: TaskStatus;
  defaultProjectId?: string | null;
  onCreated?: (task: TaskRow) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    title: "",
    description: "",
    projectId: defaultProjectId ?? projects[0]?.id ?? "",
    status: defaultStatus ?? "TODO",
    priority: "MEDIUM",
    assigneeEmployeeId: null,
    dueDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          projectId: values.projectId || null,
          status: values.status,
          priority: values.priority,
          assigneeEmployeeId: values.assigneeEmployeeId,
          dueDate: values.dueDate || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Create failed" }));
        throw new Error(body.error ?? `Create failed (${res.status})`);
      }
      const task = await res.json();
      onCreated?.(task);
      onOpenChange(false);
      setValues({
        title: "",
        description: "",
        projectId: defaultProjectId ?? projects[0]?.id ?? "",
        status: defaultStatus ?? "TODO",
        priority: "MEDIUM",
        assigneeEmployeeId: null,
        dueDate: "",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Quick create. Press{" "}
            <kbd className="px-1 rounded bg-[#1F1F1F]">⌘+Enter</kbd> to submit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              autoFocus
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({ ...v, title: e.target.value }))
              }
              placeholder="What needs to be done?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  void submit();
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              placeholder="Optional details"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={values.projectId || "__none"}
                onValueChange={(v) =>
                  setValues((s) => ({
                    ...s,
                    projectId: v === "__none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, status: v as TaskStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={values.priority}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, priority: v as TaskPriority }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={values.dueDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <TaskAssigneePicker
              value={values.assigneeEmployeeId}
              onChange={(id) =>
                setValues((v) => ({ ...v, assigneeEmployeeId: id }))
              }
              employees={employees}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !values.title.trim()}>
              {busy ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
