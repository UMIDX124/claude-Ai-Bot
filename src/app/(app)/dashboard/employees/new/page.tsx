import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canEditSalary } from "@/lib/rbac";
import { EmployeeFormPage } from "@/components/employees/EmployeeFormPage";
import type { EmployeeRow } from "@/components/employees/types";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const user = await requireUser();
  if (!can(user, "employees.create")) {
    redirect("/dashboard/employees");
  }

  const [departments, roles, managers] = await Promise.all([
    loadDepartments(),
    loadRoles(),
    loadManagers(),
  ]);

  return (
    <EmployeeFormPage
      mode="create"
      departments={departments}
      roles={roles}
      managers={managers as EmployeeRow[]}
      canEditSalary={canEditSalary(user)}
    />
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

async function loadManagers() {
  const rows = await db.employee.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
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
