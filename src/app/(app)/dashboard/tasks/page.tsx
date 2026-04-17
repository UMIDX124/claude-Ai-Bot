import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listTasks } from "@/lib/services/task.service";
import { TaskListQuerySchema } from "@/lib/validations/task";
import { can } from "@/lib/rbac";
import { TasksBrowser } from "@/components/tasks/tasks-browser";
import {
  loadTaskPageData,
  serializedManagers,
  toTaskListResponse,
  buildViewer,
  buildPermissions,
  filtersFromSearchObject,
} from "@/components/tasks/server-helpers";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (!can(user, "tasks.read")) {
    return <p className="text-sm text-[#71717A]">You don't have access to tasks.</p>;
  }

  const query = TaskListQuerySchema.parse(filtersFromSearchObject(params));
  const { projects, labels, employees } = await loadTaskPageData();
  const result = await listTasks(user, query);

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Tasks
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {result.total} tasks across {projects.length} projects · drag to move
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
      />
    </div>
  );
}

void db;
