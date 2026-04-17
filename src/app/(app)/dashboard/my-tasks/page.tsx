import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listTasks } from "@/lib/services/task.service";
import { TaskListQuerySchema } from "@/lib/validations/task";
import { can } from "@/lib/rbac";
import { TasksBrowser } from "@/components/tasks/tasks-browser";
import {
  buildPermissions,
  buildViewer,
  filtersFromSearchObject,
  loadTaskPageData,
  serializedManagers,
  toTaskListResponse,
} from "@/components/tasks/server-helpers";

export const dynamic = "force-dynamic";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user, "tasks.read")) {
    return <p className="text-sm text-[#71717A]">No access.</p>;
  }
  const params = await searchParams;
  const base = filtersFromSearchObject(params);
  base.assigneeEmployeeId = "me";
  base.includeCompleted = "false";
  const query = TaskListQuerySchema.parse(base);

  const [{ projects, labels, employees }, result] = await Promise.all([
    loadTaskPageData(),
    listTasks(user, query),
  ]);

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            My tasks
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Open tasks assigned to you · {result.total}
          </p>
        </div>
      </header>
      <TasksBrowser
        initial={toTaskListResponse(result)}
        initialFilters={query}
        projects={projects}
        labels={labels}
        employees={serializedManagers(employees)}
        viewer={await buildViewer(user)}
        permissions={buildPermissions(user)}
        view={(params.view as "kanban" | "list" | undefined) ?? "kanban"}
        basePath="/dashboard/my-tasks"
      />
    </div>
  );
}

void db;
