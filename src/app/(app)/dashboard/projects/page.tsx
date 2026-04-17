import Link from "next/link";
import { Folder, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { EmptyState } from "@/components/employees/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (!can(user, "projects.read")) {
    return <p className="text-sm text-[#71717A]">No access.</p>;
  }
  const projects = await db.project.findMany({
    where: { deletedAt: null },
    include: {
      company: { select: { type: true, name: true } },
      lead: {
        include: {
          user: {
            select: { fullName: true, firstName: true, lastName: true, avatarUrl: true, email: true },
          },
        },
      },
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
          labels: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  const openByProject = new Map<string, number>();
  const doneByProject = new Map<string, number>();
  for (const p of projects) {
    const [open, done] = await Promise.all([
      db.task.count({
        where: {
          projectId: p.id,
          deletedAt: null,
          status: { notIn: ["DONE", "CANCELLED"] },
        },
      }),
      db.task.count({
        where: { projectId: p.id, deletedAt: null, status: "DONE" },
      }),
    ]);
    openByProject.set(p.id, open);
    doneByProject.set(p.id, done);
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          icon={<Folder className="h-6 w-6" />}
          title="No projects yet"
          description={
            can(user, "projects.create")
              ? "Create your first project to group related tasks."
              : "Ask an admin to create a project."
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Projects
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {projects.length} active · tasks grouped under shared goals
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => {
          const leadName =
            p.lead?.user?.fullName ??
            `${p.lead?.user?.firstName ?? ""} ${p.lead?.user?.lastName ?? ""}`.trim() ??
            p.lead?.user?.email ??
            null;
          const total = openByProject.get(p.id)! + doneByProject.get(p.id)!;
          const progress = total
            ? (doneByProject.get(p.id)! / total) * 100
            : 0;
          return (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="group rounded-xl border border-[#1F1F1F] bg-[#111111] p-5 space-y-3 hover:border-[#F59E0B]/40 transition-colors"
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: p.color ?? "#F59E0B" }}
                  />
                  <p className="text-[11px] uppercase tracking-wider text-[#F59E0B] font-medium">
                    {p.code}
                  </p>
                </div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider">
                  {p.company.type}
                </span>
              </header>
              <h3 className="text-base font-semibold text-[#FAFAFA] line-clamp-1">
                {p.name}
              </h3>
              {p.description && (
                <p className="text-xs text-[#A1A1AA] line-clamp-2">
                  {p.description}
                </p>
              )}
              <div className="h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <footer className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>
                  <span className="text-[#FAFAFA] font-medium">
                    {openByProject.get(p.id)}
                  </span>{" "}
                  open · {doneByProject.get(p.id)} done
                </span>
                {p.lead ? (
                  <span className="inline-flex items-center gap-1.5">
                    <EmployeeAvatar
                      name={leadName}
                      url={p.lead.user.avatarUrl ?? null}
                      size="sm"
                    />
                    <span className="text-xs text-[#A1A1AA] hidden sm:inline">
                      {leadName}
                    </span>
                  </span>
                ) : null}
              </footer>
              <div className="flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#F59E0B] opacity-0 group-hover:opacity-100 transition">
                  Open board
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {can(user, "projects.create") && (
        <div className="flex justify-end">
          <Button variant="secondary" asChild>
            <Link href="/dashboard/projects?new=1">+ New project</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
