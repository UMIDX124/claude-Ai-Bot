"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskAssigneePicker } from "./task-assignee-picker";
import { TaskStatusBadge, STATUS_META } from "./task-status-badge";
import { PRIORITY_META } from "./task-priority-badge";
import { SubtaskChecklist } from "./subtask-checklist";
import { TaskComments, type TaskComment } from "./task-comments";
import {
  TaskActivityTimeline,
  type TaskActivityItem,
} from "./task-activity-timeline";
import { TaskDependencyList } from "./task-dependency-list";
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

export function TaskDetailSheet({
  open,
  task,
  onOpenChange,
  employees,
  projects,
  labels,
  viewerId,
  allTasks,
  onRefresh,
  canEdit,
  canDelete,
  canComment,
}: {
  open: boolean;
  task: TaskRow | null;
  onOpenChange: (v: boolean) => void;
  employees: EmployeeRow[];
  projects: ProjectRow[];
  labels: TaskLabelLite[];
  viewerId: string;
  allTasks: TaskRow[];
  onRefresh: () => Promise<void> | void;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
}) {
  const [local, setLocal] = useState<TaskRow | null>(task);
  const [tab, setTab] = useState("overview");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [subtasks, setSubtasks] = useState<TaskRow[]>([]);
  const [activity, setActivity] = useState<TaskActivityItem[]>([]);
  const [deps, setDeps] = useState<{
    dependsOn: Array<{ id: string; dependsOnTask: TaskRow }>;
    blocks: Array<{ id: string; task: TaskRow }>;
  }>({ dependsOn: [], blocks: [] });

  useEffect(() => {
    setLocal(task);
  }, [task]);

  const fetchAll = useCallback(async () => {
    if (!task?.id) return;
    const [cRes, sRes, aRes, dRes] = await Promise.all([
      fetch(`/api/tasks/${task.id}/comments`, { cache: "no-store" }),
      fetch(`/api/tasks/${task.id}/subtasks`, { cache: "no-store" }),
      fetch(`/api/tasks/${task.id}/activity`, { cache: "no-store" }),
      fetch(`/api/tasks/${task.id}/dependencies`, { cache: "no-store" }),
    ]);
    if (cRes.ok) setComments(await cRes.json());
    if (sRes.ok) setSubtasks(await sRes.json());
    if (aRes.ok) setActivity(await aRes.json());
    if (dRes.ok) setDeps(await dRes.json());
  }, [task?.id]);

  useEffect(() => {
    if (open && task) void fetchAll();
  }, [open, task, fetchAll]);

  if (!local) return null;

  const assignee =
    local.assignee?.user.fullName ??
    `${local.assignee?.user.firstName ?? ""} ${local.assignee?.user.lastName ?? ""}`.trim();

  async function patch(data: Partial<TaskRow>) {
    if (!local) return;
    const optimistic = { ...local, ...data };
    setLocal(optimistic as TaskRow);
    const res = await fetch(`/api/tasks/${local.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      // Roll back on error
      setLocal(local);
      const body = await res.json().catch(() => ({ error: "Save failed" }));
      alert(body.error ?? "Save failed");
      return;
    }
    const fresh = await res.json();
    setLocal(fresh);
    await onRefresh();
    await fetchAll();
  }

  async function handleDelete() {
    if (!local || !confirm(`Delete task "${local.title}"?`)) return;
    const res = await fetch(`/api/tasks/${local.id}`, { method: "DELETE" });
    if (res.ok) {
      onOpenChange(false);
      await onRefresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Input
                defaultValue={local.title}
                disabled={!canEdit}
                className="bg-transparent border-0 text-xl font-semibold px-0 h-auto py-0 focus-visible:ring-0 focus-visible:border-0 focus-visible:bg-[#0F0F0F]/40"
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (v && v !== local.title) void patch({ title: v });
                }}
              />
              <SheetDescription className="mt-1">
                {local.project ? (
                  <>
                    <span
                      className="inline-block h-2 w-2 rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: local.project.color ?? "#F59E0B" }}
                    />
                    {local.project.code} · {local.project.name}
                  </>
                ) : (
                  "No project"
                )}
              </SheetDescription>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <TaskStatusBadge status={local.status} />
                {local.labels.map(({ label }) => (
                  <span
                    key={label.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${label.color}22`,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/dashboard/tasks/${local.id}`}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Full page
                </Link>
              </Button>
              {canDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  className="bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <section className="grid grid-cols-2 gap-3 mt-5 mb-6">
          <MetaField label="Status">
            <Select
              value={local.status}
              onValueChange={(v) => patch({ status: v as TaskStatus })}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9">
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
          </MetaField>
          <MetaField label="Priority">
            <Select
              value={local.priority}
              onValueChange={(v) => patch({ priority: v as TaskPriority })}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9">
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
          </MetaField>
          <MetaField label="Assignee">
            <TaskAssigneePicker
              value={local.assigneeEmployeeId}
              onChange={(id) => patch({ assigneeEmployeeId: id })}
              employees={employees}
              placeholder={assignee || "Unassigned"}
            />
          </MetaField>
          <MetaField label="Due date">
            <Input
              type="date"
              defaultValue={local.dueDate ? local.dueDate.slice(0, 10) : ""}
              disabled={!canEdit}
              onBlur={(e) => {
                const v = e.currentTarget.value;
                patch({ dueDate: v ? new Date(v).toISOString() : null });
              }}
            />
          </MetaField>
          <MetaField label="Project">
            <Select
              value={local.projectId ?? "__none"}
              onValueChange={(v) =>
                patch({ projectId: v === "__none" ? null : v })
              }
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9">
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
          </MetaField>
          <MetaField label="Estimate (h)">
            <Input
              type="number"
              step="0.5"
              min="0"
              defaultValue={local.estimatedHours ?? ""}
              disabled={!canEdit}
              onBlur={(e) =>
                patch({
                  estimatedHours: e.currentTarget.value
                    ? String(parseFloat(e.currentTarget.value))
                    : null,
                })
              }
            />
          </MetaField>
        </section>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks {subtasks.length ? `· ${subtasks.length}` : ""}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments {comments.length ? `· ${comments.length}` : ""}
            </TabsTrigger>
            <TabsTrigger value="deps">Dependencies</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <section>
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A] mb-2">
                  Description
                </h4>
                <Textarea
                  rows={5}
                  defaultValue={local.description ?? ""}
                  disabled={!canEdit}
                  placeholder="Add a description…"
                  onBlur={(e) => {
                    const v = e.currentTarget.value;
                    if (v !== (local.description ?? "")) {
                      patch({ description: v || null });
                    }
                  }}
                />
              </section>

              <section className="grid grid-cols-2 gap-4 text-[11px] text-[#71717A]">
                <FactRow
                  icon={<CalendarDays className="h-3 w-3" />}
                  label="Created"
                  value={format(new Date(local.createdAt), "MMM d, yyyy")}
                />
                <FactRow
                  icon={<Clock className="h-3 w-3" />}
                  label="Updated"
                  value={format(new Date(local.updatedAt), "MMM d, yyyy")}
                />
                {local.completedAt && (
                  <FactRow
                    icon={<Clock className="h-3 w-3" />}
                    label="Completed"
                    value={format(new Date(local.completedAt), "MMM d, yyyy")}
                  />
                )}
                <FactRow
                  icon={<UserIcon className="h-3 w-3" />}
                  label="Reporter"
                  value={
                    local.reporter?.user.fullName ??
                    local.reporter?.user.email ??
                    "—"
                  }
                />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="subtasks">
            <SubtaskChecklist
              taskId={local.id}
              subtasks={subtasks}
              onRefresh={fetchAll}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="comments">
            <TaskComments
              taskId={local.id}
              comments={comments}
              viewerId={viewerId}
              onRefresh={fetchAll}
              canComment={canComment}
            />
          </TabsContent>

          <TabsContent value="deps">
            <TaskDependencyList
              taskId={local.id}
              dependsOn={deps.dependsOn}
              blocks={deps.blocks}
              allTasks={allTasks}
              onRefresh={fetchAll}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="activity">
            <TaskActivityTimeline items={activity} />
          </TabsContent>
        </Tabs>

        {/* Silence unused `labels` prop warning — reserved for inline label picker */}
        <div className="hidden">{labels.length}</div>
      </SheetContent>
    </Sheet>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
        {label}
      </p>
      {children}
    </div>
  );
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#F59E0B]">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
          {label}
        </p>
        <p className="text-xs text-[#FAFAFA]">{value}</p>
      </div>
    </div>
  );
}
