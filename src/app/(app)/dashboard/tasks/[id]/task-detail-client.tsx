"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubtaskChecklist } from "@/components/tasks/subtask-checklist";
import {
  TaskComments,
  type TaskComment,
} from "@/components/tasks/task-comments";
import { TaskDependencyList } from "@/components/tasks/task-dependency-list";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { Button } from "@/components/ui/button";
import type {
  Permissions,
  ProjectRow,
  TaskLabelLite,
  TaskRow,
  ViewerContext,
} from "@/components/tasks/types";
import type { EmployeeRow } from "@/components/employees/types";

type AllTaskLite = { id: string; title: string; status: TaskRow["status"] };

export function TaskDetailClient({
  initialTask,
  projects,
  employees,
  labels,
  viewer,
  permissions,
  allTasks,
}: {
  initialTask: TaskRow;
  projects: ProjectRow[];
  employees: EmployeeRow[];
  labels: TaskLabelLite[];
  viewer: ViewerContext;
  permissions: Permissions;
  allTasks: AllTaskLite[];
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [task, setTask] = useState<TaskRow>(initialTask);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [subtasks, setSubtasks] = useState<TaskRow[]>([]);
  const [deps, setDeps] = useState<{
    dependsOn: Array<{ id: string; dependsOnTask: TaskRow }>;
    blocks: Array<{ id: string; task: TaskRow }>;
  }>({ dependsOn: [], blocks: [] });

  const fetchAll = useCallback(async () => {
    const [t, c, s, d] = await Promise.all([
      fetch(`/api/tasks/${initialTask.id}`, { cache: "no-store" }),
      fetch(`/api/tasks/${initialTask.id}/comments`, { cache: "no-store" }),
      fetch(`/api/tasks/${initialTask.id}/subtasks`, { cache: "no-store" }),
      fetch(`/api/tasks/${initialTask.id}/dependencies`, { cache: "no-store" }),
    ]);
    if (t.ok) setTask(await t.json());
    if (c.ok) setComments(await c.json());
    if (s.ok) setSubtasks(await s.json());
    if (d.ok) setDeps(await d.json());
  }, [initialTask.id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(async () => {
    await fetchAll();
    router.refresh();
  }, [fetchAll, router]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          Edit in drawer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Subtasks
          </h3>
          <SubtaskChecklist
            taskId={task.id}
            subtasks={subtasks}
            onRefresh={fetchAll}
            canEdit={permissions.update || permissions.updateAny}
          />
        </section>

        <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Dependencies
          </h3>
          <TaskDependencyList
            taskId={task.id}
            dependsOn={deps.dependsOn}
            blocks={deps.blocks}
            allTasks={
              allTasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
              })) as unknown as TaskRow[]
            }
            onRefresh={fetchAll}
            canEdit={permissions.update || permissions.updateAny}
          />
        </section>
      </div>

      <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
          Comments
        </h3>
        <TaskComments
          taskId={task.id}
          comments={comments}
          viewerId={viewer.userId}
          onRefresh={fetchAll}
          canComment={permissions.comment}
        />
      </section>

      <TaskDetailSheet
        open={sheetOpen}
        task={task}
        onOpenChange={setSheetOpen}
        projects={projects}
        employees={employees}
        labels={labels}
        viewerId={viewer.userId}
        allTasks={allTasks as unknown as TaskRow[]}
        onRefresh={refresh}
        canEdit={permissions.update || permissions.updateAny}
        canDelete={permissions.delete || permissions.deleteAny}
        canComment={permissions.comment}
      />
    </>
  );
}
