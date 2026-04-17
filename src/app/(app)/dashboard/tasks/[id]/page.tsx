import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTask, listActivity } from "@/lib/services/task.service";
import { serializeTask } from "@/lib/services/task.serialize";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { TaskDetailClient } from "./task-detail-client";
import {
  buildPermissions,
  buildViewer,
  loadTaskPageData,
  serializedManagers,
} from "@/components/tasks/server-helpers";
import type { TaskRow } from "@/components/tasks/types";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user, "tasks.read")) notFound();

  const task = await getTask(user, id);
  if (!task) notFound();

  const [activity, { projects, labels, employees }, allTasksRaw] =
    await Promise.all([
      listActivity(user, id),
      loadTaskPageData(),
      db.task.findMany({
        where: { deletedAt: null, parentId: null },
        select: { id: true, title: true, status: true },
        take: 300,
      }),
    ]);

  const row = serializeTask(task) as unknown as TaskRow;
  const viewer = await buildViewer(user);
  const permissions = buildPermissions(user);

  const assignee =
    row.assignee?.user.fullName ??
    `${row.assignee?.user.firstName ?? ""} ${row.assignee?.user.lastName ?? ""}`.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/dashboard/tasks">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to board
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            {row.title}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 flex items-center gap-2 flex-wrap">
            {row.project ? (
              <>
                <span
                  className="h-2 w-2 rounded-sm inline-block"
                  style={{ backgroundColor: row.project.color ?? "#F59E0B" }}
                />
                {row.project.code} · {row.project.name}
              </>
            ) : (
              "No project"
            )}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {format(new Date(row.createdAt), "MMM d")}
            </span>
            {row.assignee && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {assignee}
              </span>
            )}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <TaskStatusBadge status={row.status} />
            <TaskPriorityBadge priority={row.priority} variant="full" />
          </div>
        </div>
        {row.assignee && (
          <EmployeeAvatar
            name={assignee}
            url={row.assignee.user.avatarUrl}
            size="lg"
          />
        )}
      </header>

      <TaskDetailClient
        initialTask={row}
        projects={projects}
        employees={serializedManagers(employees)}
        labels={labels}
        viewer={viewer}
        permissions={permissions}
        allTasks={allTasksRaw.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
        }))}
      />

      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A] mb-3">
          Full activity timeline
        </h3>
        <TaskActivityTimeline
          items={activity.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
