import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { listTasks } from "@/lib/services/task.service";
import { TaskListQuerySchema } from "@/lib/validations/task";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
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

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user, "projects.read")) notFound();

  const project = await db.project.findUnique({
    where: { id },
    include: {
      company: true,
      lead: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
  if (!project) notFound();

  const sp = await searchParams;
  const base = filtersFromSearchObject(sp);
  base.projectId = id;
  const query = TaskListQuerySchema.parse(base);

  const [result, { projects, labels, employees }] = await Promise.all([
    listTasks(user, query),
    loadTaskPageData(),
  ]);

  const leadName =
    project.lead?.user.fullName ??
    `${project.lead?.user.firstName ?? ""} ${project.lead?.user.lastName ?? ""}`.trim() ??
    project.lead?.user.email ??
    null;

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Projects
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: project.color ?? "#F59E0B" }}
            />
            <span className="text-[11px] uppercase tracking-wider text-[#F59E0B]">
              {project.code} · {project.company.type}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mt-1">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm text-[#A1A1AA] mt-1 max-w-2xl">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[#71717A] flex-wrap">
            {project.targetDate && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3 w-3" />
                Target {format(new Date(project.targetDate), "MMM d, yyyy")}
              </span>
            )}
            {leadName && (
              <span className="inline-flex items-center gap-1.5">
                <EmployeeAvatar
                  name={leadName}
                  url={project.lead?.user.avatarUrl ?? null}
                  size="sm"
                />
                Lead: {leadName}
              </span>
            )}
            <span>{result.total} tasks</span>
          </div>
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
        view={(sp.view as "kanban" | "list" | undefined) ?? "kanban"}
        basePath={`/dashboard/projects/${id}`}
        projectContextId={id}
      />
    </div>
  );
}
