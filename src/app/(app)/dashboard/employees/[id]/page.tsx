import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  Github,
  Linkedin,
  UserCircle,
  Trash2,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getEmployee } from "@/lib/services/employee.service";
import { db } from "@/lib/db";
import { can, canEditSalary } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { StatusBadge } from "@/components/employees/StatusBadge";
import { EmployeeFormPage } from "@/components/employees/EmployeeFormPage";
import type { EmployeeRow } from "@/components/employees/types";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const [{ id }, { tab, edit }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const employee = await getEmployee(user, id);
  if (!employee) notFound();

  const row = serialize(employee);
  const canEdit = can(user, "employees.update");
  const canDelete = can(user, "employees.delete");

  if (edit === "1") {
    if (!canEdit) redirect(`/dashboard/employees/${id}`);
    const [departments, roles, managers] = await Promise.all([
      loadDepartments(),
      loadRoles(),
      loadManagers(id),
    ]);
    return (
      <EmployeeFormPage
        mode="edit"
        initial={row}
        departments={departments}
        roles={roles}
        managers={managers as EmployeeRow[]}
        canEditSalary={canEditSalary(user)}
      />
    );
  }

  const name =
    row.user.fullName ??
    [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") ??
    row.user.email;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap border-b border-[#1F1F1F] pb-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex-1 flex items-start gap-4 min-w-[300px]">
          <EmployeeAvatar name={name} url={row.user.avatarUrl} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#FAFAFA]">{name}</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {row.position ?? row.role?.name ?? "Team member"} ·{" "}
              <span className="text-[#F59E0B]">{row.company.type}</span>
              {row.employeeCode ? (
                <span className="ml-2 font-mono text-xs">{row.employeeCode}</span>
              ) : null}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge status={row.status} />
              {row.employmentType ? (
                <Badge variant="outline">{row.employmentType.replace("_", " ").toLowerCase()}</Badge>
              ) : null}
              {row.workLocation ? (
                <Badge variant="outline">{row.workLocation.toLowerCase()}</Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Button asChild>
              <Link href={`/dashboard/employees/${id}?edit=1`}>Edit</Link>
            </Button>
          ) : null}
          {canDelete && !row.deletedAt ? (
            <form action={`/api/employees/${id}`} method="POST">
              <Button
                type="submit"
                variant="secondary"
                className="text-red-300 border-red-500/30"
                formMethod="POST"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Soft delete
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue={tab ?? "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Contact">
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={row.user.email} />
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={row.user.phone ?? "—"} />
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={formatAddress(row.address)}
              />
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Timezone"
                value={row.timezone ?? "—"}
              />
            </InfoCard>
            <InfoCard title="Profile">
              {row.bio ? (
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{row.bio}</p>
              ) : (
                <p className="text-sm text-[#71717A]">No bio yet.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {row.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                {row.linkedinUrl ? (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={row.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3 w-3 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                ) : null}
                {row.githubUrl ? (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={row.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-3 w-3 mr-1" />
                      GitHub
                    </a>
                  </Button>
                ) : null}
              </div>
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="work">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Assignment">
              <Row
                icon={<Building2 className="h-4 w-4" />}
                label="Company"
                value={row.company.name}
              />
              <Row
                icon={<Briefcase className="h-4 w-4" />}
                label="Department"
                value={row.department?.name ?? "—"}
              />
              <Row
                icon={<Briefcase className="h-4 w-4" />}
                label="Role"
                value={row.role?.name ?? row.position ?? "—"}
              />
              <Row
                icon={<UserCircle className="h-4 w-4" />}
                label="Manager"
                value={
                  row.manager
                    ? row.manager.user.fullName ?? row.manager.user.email
                    : "—"
                }
              />
            </InfoCard>
            <InfoCard title="Timeline">
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Hire date"
                value={
                  row.hireDate
                    ? new Date(row.hireDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"
                }
              />
              {row.probationEndDate ? (
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label="Probation ends"
                  value={new Date(row.probationEndDate).toLocaleDateString()}
                />
              ) : null}
              {row.terminationDate ? (
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label="Termination"
                  value={new Date(row.terminationDate).toLocaleDateString()}
                />
              ) : null}
              {row.terminationReason ? (
                <p className="text-xs text-[#71717A] pl-6">
                  Reason: {row.terminationReason}
                </p>
              ) : null}
            </InfoCard>
            {row.salaryVisible ? (
              <InfoCard title="Compensation">
                <Row
                  label="Salary"
                  value={
                    row.salary
                      ? `${row.salaryCurrency} ${Number.parseFloat(row.salary).toLocaleString()}`
                      : "—"
                  }
                />
                <p className="text-[11px] text-[#71717A]">
                  Visible to OWNER and ADMIN only.
                </p>
              </InfoCard>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="emergency">
          {row.emergencyContact ? (
            <InfoCard title="Emergency contact">
              <Row label="Name" value={row.emergencyContact.name ?? "—"} />
              <Row label="Relation" value={row.emergencyContact.relation ?? "—"} />
              <Row label="Phone" value={row.emergencyContact.phone ?? "—"} />
              <Row label="Email" value={row.emergencyContact.email ?? "—"} />
            </InfoCard>
          ) : (
            <p className="text-sm text-[#71717A]">No emergency contact on file.</p>
          )}
        </TabsContent>

        <TabsContent value="history">
          <History employeeId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon ? (
        <span className="mt-0.5 text-[#F59E0B]">{icon}</span>
      ) : (
        <span className="w-4" />
      )}
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wider text-[#71717A]">{label}</p>
        <p className="text-sm text-[#FAFAFA]">{value}</p>
      </div>
    </div>
  );
}

async function History({ employeeId }: { employeeId: string }) {
  const rows = await db.auditLog.findMany({
    where: { resourceType: "Employee", resourceId: employeeId },
    include: { actor: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#71717A]">No audit history yet for this employee.</p>
    );
  }
  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3"
        >
          <header className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="inline-flex px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] uppercase tracking-wider">
              {r.action}
            </span>
            <span>
              {r.actor?.fullName ?? r.actor?.email ?? "system"}
            </span>
            <span className="ml-auto text-[10px] text-[#71717A]">
              {new Date(r.createdAt).toLocaleString()}
            </span>
          </header>
        </li>
      ))}
    </ol>
  );
}

function serialize(
  e: Awaited<ReturnType<typeof getEmployee>>,
): EmployeeRow {
  if (!e) throw new Error("not found");
  return {
    ...e,
    hireDate: e.hireDate ? e.hireDate.toISOString() : null,
    probationEndDate: e.probationEndDate ? e.probationEndDate.toISOString() : null,
    terminationDate: e.terminationDate ? e.terminationDate.toISOString() : null,
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  } as EmployeeRow;
}

function formatAddress(
  addr:
    | { line1?: string; city?: string; country?: string; state?: string }
    | null
    | undefined,
): string {
  if (!addr) return "—";
  const parts = [addr.line1, addr.city, addr.state, addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

async function loadDepartments() {
  const rows = await db.department.findMany({
    where: { deletedAt: null },
    include: {
      company: { select: { id: true, type: true, name: true } },
      _count: { select: { employees: { where: { deletedAt: null } }, roles: true } },
    },
    orderBy: [{ company: { type: "asc" } }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    color: r.color,
    company: r.company,
    _count: r._count,
  }));
}

async function loadRoles() {
  const rows = await db.role.findMany({
    where: { deletedAt: null },
    include: {
      department: { select: { id: true, name: true, companyId: true } },
      _count: { select: { employees: { where: { deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    seniority: r.seniority,
    department: r.department,
    _count: r._count,
  }));
}

async function loadManagers(excludeId: string) {
  const rows = await db.employee.findMany({
    where: { deletedAt: null, id: { not: excludeId } },
    include: {
      user: true,
      company: true,
      department: true,
      role: true,
      manager: {
        include: {
          user: {
            select: { firstName: true, lastName: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: [{ user: { fullName: "asc" } }],
    take: 100,
  });
  return rows.map((r) => ({
    ...r,
    salary: null,
    salaryVisible: false,
    hireDate: r.hireDate?.toISOString() ?? null,
    probationEndDate: r.probationEndDate?.toISOString() ?? null,
    terminationDate: r.terminationDate?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
  }));
}
