import { Prisma } from "@prisma/client";
import type {
  EmployeeStatus,
  User,
  UserRole,
  CompanyType,
} from "@prisma/client";
import { db } from "@/lib/db";
import { audit, diff as auditDiff } from "@/lib/audit";
import { assertCan, can, canViewSalary } from "@/lib/rbac";
import { log } from "@/lib/logger";
import type {
  EmployeeCreateInput,
  EmployeeListQuery,
  EmployeeUpdateInput,
  EmployeeBulkUpdateInput,
  EmployeeBulkDeleteInput,
  EmployeeInviteInput,
  EmployeeImportRow,
} from "@/lib/validations/employee";

const EMPLOYEE_RELATIONS = {
  user: true,
  company: true,
  department: true,
  role: true,
  manager: {
    include: { user: { select: { firstName: true, lastName: true, fullName: true, email: true } } },
  },
} satisfies Prisma.EmployeeInclude;

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_RELATIONS;
}>;

export type EmployeeListResult = {
  items: SafeEmployee[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type SafeEmployee = Omit<EmployeeWithRelations, "salary"> & {
  salary: string | null;
  salaryVisible: boolean;
};

function toSafe(
  employee: EmployeeWithRelations,
  viewer: Pick<User, "role">,
): SafeEmployee {
  const visible = canViewSalary(viewer);
  const { salary, ...rest } = employee;
  return {
    ...rest,
    salary: visible && salary !== null ? salary.toString() : null,
    salaryVisible: visible,
  };
}

export async function listEmployees(
  viewer: User,
  query: EmployeeListQuery,
): Promise<EmployeeListResult> {
  assertCan(viewer, "employees.read");

  const where: Prisma.EmployeeWhereInput = {};
  if (query.onlyDeleted) {
    where.deletedAt = { not: null };
  } else if (!query.includeDeleted) {
    where.deletedAt = null;
  }

  if (query.company?.length) {
    where.company = { type: { in: query.company } };
  }
  if (query.departmentId?.length) where.departmentId = { in: query.departmentId };
  if (query.roleId?.length) where.roleId = { in: query.roleId };
  if (query.status?.length) where.status = { in: query.status };
  if (query.employmentType?.length)
    where.employmentType = { in: query.employmentType };
  if (query.workLocation?.length)
    where.workLocation = { in: query.workLocation };
  if (query.managerId) where.managerId = query.managerId;

  if (query.q) {
    where.OR = [
      { employeeCode: { contains: query.q, mode: "insensitive" } },
      { position: { contains: query.q, mode: "insensitive" } },
      { user: { fullName: { contains: query.q, mode: "insensitive" } } },
      { user: { email: { contains: query.q, mode: "insensitive" } } },
      { user: { firstName: { contains: query.q, mode: "insensitive" } } },
      { user: { lastName: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const orderBy = parseSort(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await db.$transaction([
    db.employee.count({ where }),
    db.employee.findMany({
      where,
      include: EMPLOYEE_RELATIONS,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map((r) => toSafe(r, viewer)),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function parseSort(
  sort: EmployeeListQuery["sort"],
): Prisma.EmployeeOrderByWithRelationInput | Prisma.EmployeeOrderByWithRelationInput[] {
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const key = sort.replace(/^-/, "");
  switch (key) {
    case "name":
      return [
        { user: { fullName: dir } },
        { user: { firstName: dir } },
      ];
    case "hireDate":
      return { hireDate: { sort: dir, nulls: "last" } };
    case "status":
      return { status: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function getEmployee(
  viewer: User,
  id: string,
): Promise<SafeEmployee | null> {
  assertCan(viewer, "employees.read");
  const row = await db.employee.findUnique({
    where: { id },
    include: EMPLOYEE_RELATIONS,
  });
  if (!row) return null;
  return toSafe(row, viewer);
}

async function nextEmployeeCode(companyType: CompanyType): Promise<string> {
  const rows = await db.employee.findMany({
    where: { employeeCode: { startsWith: `${companyType}-` } },
    select: { employeeCode: true },
    orderBy: { employeeCode: "desc" },
    take: 50,
  });
  let max = 0;
  for (const { employeeCode } of rows) {
    const m = employeeCode?.match(/-(\d+)$/);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${companyType}-${String(max + 1).padStart(4, "0")}`;
}

export async function createEmployee(
  actor: User,
  input: EmployeeCreateInput,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<SafeEmployee> {
  assertCan(actor, "employees.create");
  if (input.salary !== null && input.salary !== undefined) {
    assertCan(actor, "employees.update.salary");
  }

  const company = await db.company.findUnique({
    where: { type: input.companyType },
  });
  if (!company) {
    throw statusError(400, `Unknown company: ${input.companyType}`);
  }

  const code = await nextEmployeeCode(input.companyType);
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");
  const clerkStub = `pending_${cleanIdentifier(input.email)}`;

  const created = await db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: input.email } });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            fullName,
            phone: input.phone ?? existing.phone,
            role: input.userRole,
          },
        })
      : await tx.user.create({
          data: {
            clerkId: clerkStub,
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            fullName,
            phone: input.phone ?? null,
            role: input.userRole,
          },
        });

    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        companyId: company.id,
        departmentId: input.departmentId ?? null,
        roleId: input.roleId ?? null,
        managerId: input.managerId ?? null,
        employeeCode: code,
        position: input.position ?? null,
        employmentType: input.employmentType ?? null,
        workLocation: input.workLocation ?? null,
        hireDate: input.hireDate ?? null,
        probationEndDate: input.probationEndDate ?? null,
        birthday: input.birthday ?? null,
        salary: input.salary ?? null,
        salaryCurrency: input.salaryCurrency ?? "USD",
        timezone: input.timezone ?? null,
        bio: input.bio ?? null,
        linkedinUrl: normalizeUrl(input.linkedinUrl),
        githubUrl: normalizeUrl(input.githubUrl),
        skills: input.skills ?? [],
        address: input.address ?? undefined,
        emergencyContact: input.emergencyContact ?? undefined,
        status: input.status ?? "ACTIVE",
      },
      include: EMPLOYEE_RELATIONS,
    });
    return employee;
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Employee",
    resourceId: created.id,
    after: safeAuditPayload(created),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return toSafe(created, actor);
}

export async function updateEmployee(
  actor: User,
  id: string,
  input: EmployeeUpdateInput,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<SafeEmployee> {
  assertCan(actor, "employees.update");
  if (input.salary !== undefined && input.salary !== null) {
    assertCan(actor, "employees.update.salary");
  }

  const before = await db.employee.findUnique({
    where: { id },
    include: EMPLOYEE_RELATIONS,
  });
  if (!before) throw statusError(404, "Employee not found");

  const updated = await db.$transaction(async (tx) => {
    const userPatch: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) userPatch.firstName = input.firstName;
    if (input.lastName !== undefined) userPatch.lastName = input.lastName;
    if (input.email !== undefined) userPatch.email = input.email;
    if (input.phone !== undefined) userPatch.phone = input.phone;
    if (input.userRole !== undefined) userPatch.role = input.userRole;
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const first = input.firstName ?? before.user.firstName ?? "";
      const last = input.lastName ?? before.user.lastName ?? "";
      userPatch.fullName = [first, last].filter(Boolean).join(" ") || null;
    }
    if (Object.keys(userPatch).length > 0) {
      await tx.user.update({ where: { id: before.userId }, data: userPatch });
    }

    const empPatch: Prisma.EmployeeUpdateInput = {};
    if (input.companyType !== undefined) {
      const company = await tx.company.findUnique({ where: { type: input.companyType } });
      if (company) empPatch.company = { connect: { id: company.id } };
    }
    if (input.departmentId !== undefined) {
      empPatch.department = input.departmentId
        ? { connect: { id: input.departmentId } }
        : { disconnect: true };
    }
    if (input.roleId !== undefined) {
      empPatch.role = input.roleId
        ? { connect: { id: input.roleId } }
        : { disconnect: true };
    }
    if (input.managerId !== undefined) {
      empPatch.manager = input.managerId
        ? { connect: { id: input.managerId } }
        : { disconnect: true };
    }
    if (input.position !== undefined) empPatch.position = input.position;
    if (input.employmentType !== undefined) empPatch.employmentType = input.employmentType;
    if (input.workLocation !== undefined) empPatch.workLocation = input.workLocation;
    if (input.hireDate !== undefined) empPatch.hireDate = input.hireDate;
    if (input.probationEndDate !== undefined) empPatch.probationEndDate = input.probationEndDate;
    if (input.birthday !== undefined) empPatch.birthday = input.birthday;
    if (input.salary !== undefined) empPatch.salary = input.salary;
    if (input.salaryCurrency !== undefined) empPatch.salaryCurrency = input.salaryCurrency;
    if (input.timezone !== undefined) empPatch.timezone = input.timezone;
    if (input.bio !== undefined) empPatch.bio = input.bio;
    if (input.linkedinUrl !== undefined) empPatch.linkedinUrl = normalizeUrl(input.linkedinUrl);
    if (input.githubUrl !== undefined) empPatch.githubUrl = normalizeUrl(input.githubUrl);
    if (input.skills !== undefined) empPatch.skills = input.skills;
    if (input.address !== undefined) empPatch.address = input.address ?? Prisma.JsonNull;
    if (input.emergencyContact !== undefined) {
      empPatch.emergencyContact = input.emergencyContact ?? Prisma.JsonNull;
    }
    if (input.status !== undefined) empPatch.status = input.status;

    return tx.employee.update({
      where: { id },
      data: empPatch,
      include: EMPLOYEE_RELATIONS,
    });
  });

  const changed = auditDiff(
    safeAuditPayload(before),
    safeAuditPayload(updated),
  );
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Employee",
    resourceId: updated.id,
    before: changed.before,
    after: changed.after,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return toSafe(updated, actor);
}

export async function softDeleteEmployee(
  actor: User,
  id: string,
  meta: { ipAddress?: string | null; userAgent?: string | null; reason?: string } = {},
): Promise<SafeEmployee> {
  assertCan(actor, "employees.delete");
  const before = await db.employee.findUnique({
    where: { id },
    include: EMPLOYEE_RELATIONS,
  });
  if (!before) throw statusError(404, "Employee not found");
  if (before.deletedAt) throw statusError(400, "Employee already deleted");

  const updated = await db.employee.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "TERMINATED" as EmployeeStatus,
      terminationDate: new Date(),
      terminationReason: meta.reason ?? null,
    },
    include: EMPLOYEE_RELATIONS,
  });

  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Employee",
    resourceId: id,
    before: safeAuditPayload(before),
    after: safeAuditPayload(updated),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: meta.reason ? { reason: meta.reason } : undefined,
  });

  return toSafe(updated, actor);
}

export async function restoreEmployee(
  actor: User,
  id: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<SafeEmployee> {
  assertCan(actor, "employees.restore");
  const before = await db.employee.findUnique({
    where: { id },
    include: EMPLOYEE_RELATIONS,
  });
  if (!before) throw statusError(404, "Employee not found");
  if (!before.deletedAt) throw statusError(400, "Employee is not deleted");

  const updated = await db.employee.update({
    where: { id },
    data: {
      deletedAt: null,
      status: "ACTIVE" as EmployeeStatus,
      terminationDate: null,
      terminationReason: null,
    },
    include: EMPLOYEE_RELATIONS,
  });

  await audit({
    actorId: actor.id,
    action: "RESTORE",
    resourceType: "Employee",
    resourceId: id,
    before: safeAuditPayload(before),
    after: safeAuditPayload(updated),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return toSafe(updated, actor);
}

export async function bulkUpdateEmployees(
  actor: User,
  input: EmployeeBulkUpdateInput,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<{ updated: number }> {
  assertCan(actor, "employees.bulk");
  assertCan(actor, "employees.update");

  const data: Prisma.EmployeeUpdateManyMutationInput = {};
  if (input.patch.status !== undefined) data.status = input.patch.status;
  if (input.patch.employmentType !== undefined) data.employmentType = input.patch.employmentType;
  if (input.patch.workLocation !== undefined) data.workLocation = input.patch.workLocation;

  const scalarData: Prisma.EmployeeUpdateManyMutationInput = { ...data };
  if (input.patch.departmentId !== undefined) {
    (scalarData as Prisma.EmployeeUncheckedUpdateManyInput).departmentId =
      input.patch.departmentId;
  }
  if (input.patch.roleId !== undefined) {
    (scalarData as Prisma.EmployeeUncheckedUpdateManyInput).roleId = input.patch.roleId;
  }
  if (input.patch.managerId !== undefined) {
    (scalarData as Prisma.EmployeeUncheckedUpdateManyInput).managerId =
      input.patch.managerId;
  }

  const result = await db.employee.updateMany({
    where: { id: { in: input.ids }, deletedAt: null },
    data: scalarData,
  });

  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Employee",
    resourceId: null,
    metadata: { ids: input.ids, patch: input.patch, count: result.count },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { updated: result.count };
}

export async function bulkSoftDelete(
  actor: User,
  input: EmployeeBulkDeleteInput,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<{ deleted: number }> {
  assertCan(actor, "employees.delete");
  assertCan(actor, "employees.bulk");

  const now = new Date();
  const result = await db.employee.updateMany({
    where: { id: { in: input.ids }, deletedAt: null },
    data: { deletedAt: now, status: "TERMINATED", terminationDate: now },
  });

  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Employee",
    resourceId: null,
    metadata: { ids: input.ids, count: result.count },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { deleted: result.count };
}

export async function inviteEmployee(
  actor: User,
  input: EmployeeInviteInput,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<SafeEmployee> {
  assertCan(actor, "employees.invite");
  const existing = await db.user.findUnique({
    where: { email: input.email },
    include: { employee: true },
  });
  if (existing?.employee) {
    throw statusError(409, "Employee with this email already exists");
  }

  const created = await createEmployee(
    actor,
    {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      companyType: input.companyType,
      departmentId: input.departmentId ?? null,
      roleId: input.roleId ?? null,
      userRole: input.userRole,
      phone: null,
      managerId: null,
      position: null,
      employmentType: null,
      workLocation: null,
      hireDate: null,
      probationEndDate: null,
      birthday: null,
      salary: null,
      salaryCurrency: "USD",
      timezone: null,
      bio: null,
      linkedinUrl: null,
      githubUrl: null,
      skills: [],
      address: null,
      emergencyContact: null,
      status: "ACTIVE",
      sendInvite: true,
    },
    meta,
  );

  log.info("employee.invite.queued", {
    actorId: actor.id,
    employeeId: created.id,
    email: input.email,
  });

  return created;
}

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

export async function importCsv(
  actor: User,
  rows: EmployeeImportRow[],
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<ImportSummary> {
  assertCan(actor, "employees.import");
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: [] };

  let rowIndex = 0;
  for (const row of rows) {
    rowIndex += 1;
    try {
      const company = await db.company.findUnique({ where: { type: row.companyType } });
      if (!company) throw new Error(`Unknown company ${row.companyType}`);
      let departmentId: string | null = null;
      if (row.departmentCode) {
        const dept = await db.department.findFirst({
          where: { companyId: company.id, code: row.departmentCode },
        });
        departmentId = dept?.id ?? null;
      }
      let roleId: string | null = null;
      if (row.roleName && departmentId) {
        const role = await db.role.findFirst({
          where: { name: row.roleName, departmentId },
        });
        roleId = role?.id ?? null;
      }

      const existing = await db.user.findUnique({
        where: { email: row.email },
        include: { employee: true },
      });

      if (existing?.employee) {
        await updateEmployee(
          actor,
          existing.employee.id,
          {
            firstName: row.firstName,
            lastName: row.lastName,
            companyType: row.companyType,
            departmentId,
            roleId,
            position: row.position,
            employmentType: row.employmentType,
            workLocation: row.workLocation,
            hireDate: row.hireDate,
            salary: row.salary,
          },
          meta,
        );
        summary.updated += 1;
      } else {
        await createEmployee(
          actor,
          {
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            companyType: row.companyType,
            departmentId,
            roleId,
            managerId: null,
            position: row.position ?? null,
            employmentType: row.employmentType ?? null,
            workLocation: row.workLocation ?? null,
            hireDate: row.hireDate ?? null,
            probationEndDate: null,
            birthday: null,
            salary: row.salary ?? null,
            salaryCurrency: "USD",
            timezone: null,
            bio: null,
            linkedinUrl: null,
            githubUrl: null,
            userRole: "EMPLOYEE" as UserRole,
            phone: null,
            skills: [],
            address: null,
            emergencyContact: null,
            status: "ACTIVE",
            sendInvite: false,
          },
          meta,
        );
        summary.created += 1;
      }
    } catch (err) {
      summary.skipped += 1;
      summary.errors.push({
        row: rowIndex,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await audit({
    actorId: actor.id,
    action: "IMPORT",
    resourceType: "Employee",
    metadata: {
      total: rows.length,
      created: summary.created,
      updated: summary.updated,
      skipped: summary.skipped,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return summary;
}

const EXPORT_COLUMNS = [
  "employeeCode",
  "firstName",
  "lastName",
  "email",
  "phone",
  "companyType",
  "department",
  "role",
  "position",
  "status",
  "employmentType",
  "workLocation",
  "hireDate",
  "salary",
  "salaryCurrency",
  "managerEmail",
] as const;

export async function exportCsv(
  actor: User,
  query: EmployeeListQuery,
): Promise<string> {
  assertCan(actor, "employees.export");

  const effectiveQuery = {
    ...query,
    page: 1,
    pageSize: 1000,
  } satisfies EmployeeListQuery;
  const { items } = await listEmployees(actor, effectiveQuery);
  const canSalary = canViewSalary(actor);

  const header = EXPORT_COLUMNS.join(",");
  const rows = items.map((e) => {
    const manager = e.manager?.user;
    const record: Record<(typeof EXPORT_COLUMNS)[number], string | null> = {
      employeeCode: e.employeeCode ?? null,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      email: e.user.email,
      phone: e.user.phone,
      companyType: e.company.type,
      department: e.department?.name ?? null,
      role: e.role?.name ?? null,
      position: e.position,
      status: e.status,
      employmentType: e.employmentType,
      workLocation: e.workLocation,
      hireDate: e.hireDate ? e.hireDate.toISOString().slice(0, 10) : null,
      salary: canSalary ? e.salary : null,
      salaryCurrency: canSalary ? e.salaryCurrency : null,
      managerEmail: manager?.email ?? null,
    };
    return EXPORT_COLUMNS.map((c) => csvCell(record[c])).join(",");
  });

  await audit({
    actorId: actor.id,
    action: "EXPORT",
    resourceType: "Employee",
    metadata: { count: items.length, salaryIncluded: canSalary },
  });

  return [header, ...rows].join("\n");
}

function csvCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[,"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function cleanIdentifier(email: string): string {
  return email.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function safeAuditPayload(employee: EmployeeWithRelations) {
  return {
    id: employee.id,
    userId: employee.userId,
    companyId: employee.companyId,
    departmentId: employee.departmentId,
    roleId: employee.roleId,
    managerId: employee.managerId,
    employeeCode: employee.employeeCode,
    position: employee.position,
    status: employee.status,
    employmentType: employee.employmentType,
    workLocation: employee.workLocation,
    hireDate: employee.hireDate?.toISOString() ?? null,
    probationEndDate: employee.probationEndDate?.toISOString() ?? null,
    terminationDate: employee.terminationDate?.toISOString() ?? null,
    terminationReason: employee.terminationReason,
    salary: employee.salary?.toString() ?? null,
    salaryCurrency: employee.salaryCurrency,
    timezone: employee.timezone,
    skills: employee.skills,
    deletedAt: employee.deletedAt?.toISOString() ?? null,
    user: {
      email: employee.user.email,
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      role: employee.user.role,
    },
  };
}

export function canSeeSalary(viewer: Pick<User, "role">): boolean {
  return can(viewer, "employees.read.salary");
}
