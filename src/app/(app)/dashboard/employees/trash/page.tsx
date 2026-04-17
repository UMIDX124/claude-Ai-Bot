import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  listEmployees,
} from "@/lib/services/employee.service";
import { can, canViewSalary } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EmployeeListQuerySchema } from "@/lib/validations/employee";
import { Button } from "@/components/ui/button";
import { EmployeesBrowser } from "@/components/employees/EmployeesBrowser";
import type { EmployeeRow } from "@/components/employees/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmployeesTrashPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const base = normalize(params);
  base.onlyDeleted = "true";
  const query = EmployeeListQuerySchema.parse(base);

  const [listData, departments, roles, managers] = await Promise.all([
    listEmployees(user, query),
    loadDepartments(),
    loadRoles(),
    loadManagers(user),
  ]);

  const permissions = {
    create: false,
    update: can(user, "employees.update"),
    delete: can(user, "employees.delete") || can(user, "employees.restore"),
    invite: false,
    import: false,
    export: can(user, "employees.export"),
    bulk: can(user, "employees.bulk"),
    viewSalary: canViewSalary(user),
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to active
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Terminated employees
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {listData.total} records — restore to re-activate.
          </p>
        </div>
      </header>
      <EmployeesBrowser
        initial={toListResponse(listData)}
        initialFilters={query}
        departments={departments}
        roles={roles}
        managers={managers as EmployeeRow[]}
        permissions={permissions}
        mode="trash"
        basePath="/dashboard/employees/trash"
      />
    </div>
  );
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

async function loadManagers(user: Awaited<ReturnType<typeof requireUser>>) {
  const { listEmployees: svcList } = await import("@/lib/services/employee.service");
  const result = await svcList(user, {
    page: 1,
    pageSize: 100,
    sort: "name",
    includeDeleted: false,
    onlyDeleted: false,
  });
  return result.items;
}

function normalize(params: SearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

function toListResponse(data: Awaited<ReturnType<typeof listEmployees>>) {
  return {
    ...data,
    items: data.items.map((i) => ({
      ...i,
      hireDate: i.hireDate ? i.hireDate.toISOString() : null,
      probationEndDate: i.probationEndDate ? i.probationEndDate.toISOString() : null,
      terminationDate: i.terminationDate ? i.terminationDate.toISOString() : null,
      deletedAt: i.deletedAt ? i.deletedAt.toISOString() : null,
    })) as EmployeeRow[],
  };
}
