"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CompanyType, EmployeeStatus, UserRole } from "@prisma/client";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmployeeCreateSchema,
  type EmployeeCreateInput,
} from "@/lib/validations/employee";
import type { DepartmentOption, EmployeeRow, RoleOption } from "./types";

type FormValues = z.input<typeof EmployeeCreateSchema>;
type OutputValues = EmployeeCreateInput;

const USER_ROLES: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"];
const COMPANIES: CompanyType[] = ["DPL", "VCS", "BSL"];
const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
];

export function EmployeeForm({
  mode,
  initial,
  departments,
  roles,
  managers,
  canEditSalary,
  onSubmit,
  onCancel,
  submitting,
}: {
  mode: "create" | "edit";
  initial?: EmployeeRow | null;
  departments: DepartmentOption[];
  roles: RoleOption[];
  managers: EmployeeRow[];
  canEditSalary: boolean;
  onSubmit: (values: OutputValues) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const defaults = useMemo<FormValues>(() => buildDefaults(initial), [initial]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues, unknown, OutputValues>({
    resolver: zodResolver(EmployeeCreateSchema),
    defaultValues: defaults,
  });

  const companyType = watch("companyType");
  const departmentId = watch("departmentId") ?? null;
  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.company.type === companyType),
    [departments, companyType],
  );
  const filteredRoles = useMemo(
    () =>
      roles.filter((r) =>
        departmentId ? r.department?.id === departmentId : true,
      ),
    [roles, departmentId],
  );

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-6"
    >
      <Section title="Identity" subtitle="Name, email, and login role.">
        <Grid2>
          <Field label="First name" error={errors.firstName?.message}>
            <Input {...register("firstName")} autoComplete="given-name" />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input {...register("lastName")} autoComplete="family-name" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} disabled={mode === "edit"} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="+1 555 555 0100" />
          </Field>
          <Field label="User role" error={errors.userRole?.message}>
            <SelectField
              value={watch("userRole")}
              onChange={(v) => setValue("userRole", v as UserRole)}
              options={USER_ROLES.map((r) => ({ value: r, label: r }))}
            />
          </Field>
          <Field label="Employee status" error={errors.status?.message}>
            <SelectField
              value={watch("status")}
              onChange={(v) => setValue("status", v as EmployeeStatus)}
              options={EMPLOYEE_STATUSES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              }))}
            />
          </Field>
        </Grid2>
      </Section>

      <Section title="Assignment" subtitle="Where and who they report to.">
        <Grid2>
          <Field label="Company" error={errors.companyType?.message}>
            <SelectField
              value={watch("companyType")}
              onChange={(v) => {
                setValue("companyType", v as CompanyType);
                setValue("departmentId", null);
                setValue("roleId", null);
              }}
              options={COMPANIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Department" error={errors.departmentId?.message}>
            <SelectField
              value={watch("departmentId") ?? ""}
              onChange={(v) => {
                setValue("departmentId", v || null);
                setValue("roleId", null);
              }}
              options={[
                { value: "", label: "—" },
                ...filteredDepartments.map((d) => ({
                  value: d.id,
                  label: d.name,
                })),
              ]}
            />
          </Field>
          <Field label="Role" error={errors.roleId?.message}>
            <SelectField
              value={watch("roleId") ?? ""}
              onChange={(v) => setValue("roleId", v || null)}
              options={[
                { value: "", label: "—" },
                ...filteredRoles.map((r) => ({ value: r.id, label: r.name })),
              ]}
            />
          </Field>
          <Field label="Manager" error={errors.managerId?.message}>
            <SelectField
              value={watch("managerId") ?? ""}
              onChange={(v) => setValue("managerId", v || null)}
              options={[
                { value: "", label: "No manager" },
                ...managers.map((m) => ({
                  value: m.id,
                  label:
                    m.user.fullName ??
                    `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() ??
                    m.user.email,
                })),
              ]}
            />
          </Field>
          <Field label="Position" error={errors.position?.message}>
            <Input {...register("position")} placeholder="Senior Software Engineer" />
          </Field>
          <Field label="Employment type" error={errors.employmentType?.message}>
            <SelectField
              value={watch("employmentType") ?? ""}
              onChange={(v) => setValue("employmentType", (v || null) as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | null)}
              options={[
                { value: "", label: "—" },
                { value: "FULL_TIME", label: "Full time" },
                { value: "PART_TIME", label: "Part time" },
                { value: "CONTRACT", label: "Contract" },
                { value: "INTERN", label: "Intern" },
              ]}
            />
          </Field>
          <Field label="Work location" error={errors.workLocation?.message}>
            <SelectField
              value={watch("workLocation") ?? ""}
              onChange={(v) => setValue("workLocation", (v || null) as "REMOTE" | "HYBRID" | "ONSITE" | null)}
              options={[
                { value: "", label: "—" },
                { value: "REMOTE", label: "Remote" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "ONSITE", label: "On-site" },
              ]}
            />
          </Field>
        </Grid2>
      </Section>

      <Section title="Timeline" subtitle="Hire, probation, and birthday.">
        <Grid2>
          <Field label="Hire date" error={errors.hireDate?.message}>
            <Input type="date" {...register("hireDate")} />
          </Field>
          <Field label="Probation end" error={errors.probationEndDate?.message}>
            <Input type="date" {...register("probationEndDate")} />
          </Field>
          <Field label="Birthday" error={errors.birthday?.message}>
            <Input type="date" {...register("birthday")} />
          </Field>
          <Field label="Timezone" error={errors.timezone?.message}>
            <Input {...register("timezone")} placeholder="Asia/Karachi" />
          </Field>
        </Grid2>
      </Section>

      {canEditSalary ? (
        <Section
          title="Compensation"
          subtitle="Only visible to owners and admins."
        >
          <Grid2>
            <Field label="Salary" error={errors.salary?.message}>
              <Input
                type="number"
                step="1000"
                min="0"
                {...register("salary")}
                placeholder="80000"
              />
            </Field>
            <Field label="Currency" error={errors.salaryCurrency?.message}>
              <Input
                {...register("salaryCurrency")}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
              />
            </Field>
          </Grid2>
        </Section>
      ) : null}

      <Section title="Profile" subtitle="Bio, socials, and skills.">
        <div className="space-y-4">
          <Field label="Bio" error={errors.bio?.message}>
            <Textarea
              {...register("bio")}
              rows={3}
              placeholder="Short bio visible to team"
            />
          </Field>
          <Grid2>
            <Field label="LinkedIn URL" error={errors.linkedinUrl?.message}>
              <Input {...register("linkedinUrl")} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="GitHub URL" error={errors.githubUrl?.message}>
              <Input {...register("githubUrl")} placeholder="https://github.com/…" />
            </Field>
          </Grid2>
          <Field label="Skills" error={errors.skills?.message}>
            <SkillsInput
              value={watch("skills") ?? []}
              onChange={(next) => setValue("skills", next)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Address" subtitle="Optional mailing address.">
        <Grid2>
          <Field label="Line 1">
            <Input {...register("address.line1")} />
          </Field>
          <Field label="Line 2">
            <Input {...register("address.line2")} />
          </Field>
          <Field label="City">
            <Input {...register("address.city")} />
          </Field>
          <Field label="State / Region">
            <Input {...register("address.state")} />
          </Field>
          <Field label="Postal code">
            <Input {...register("address.postalCode")} />
          </Field>
          <Field label="Country">
            <Input {...register("address.country")} />
          </Field>
        </Grid2>
      </Section>

      <Section title="Emergency contact">
        <Grid2>
          <Field label="Name">
            <Input {...register("emergencyContact.name")} />
          </Field>
          <Field label="Relation">
            <Input {...register("emergencyContact.relation")} placeholder="Spouse, parent…" />
          </Field>
          <Field label="Phone">
            <Input {...register("emergencyContact.phone")} />
          </Field>
          <Field label="Email">
            <Input type="email" {...register("emergencyContact.email")} />
          </Field>
        </Grid2>
      </Section>

      <footer className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create employee" : "Save changes"}
        </Button>
      </footer>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-4">
      <header>
        <h3 className="text-sm font-medium text-[#FAFAFA]">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-[#71717A] mt-1">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-[11px] text-red-400">{error}</p> : null}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={`${o.value}-${o.label}`} value={o.value || "__empty"} disabled={!o.value && o.label === "—"}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SkillsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-2 flex flex-wrap gap-1.5">
      {value.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-xs px-2 py-0.5"
        >
          {s}
          <button
            type="button"
            className="hover:text-[#FAFAFA]"
            onClick={() => onChange(value.filter((v) => v !== s))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[#FAFAFA] placeholder:text-[#71717A] px-1"
        placeholder="Type a skill and press Enter"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const val = e.currentTarget.value.trim();
          if (!val) return;
          if (!value.includes(val)) onChange([...value, val]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

function buildDefaults(row: EmployeeRow | null | undefined): FormValues {
  if (!row) {
    return {
      email: "",
      firstName: "",
      lastName: "",
      phone: null,
      userRole: "EMPLOYEE",
      companyType: "DPL",
      departmentId: null,
      roleId: null,
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
      sendInvite: false,
    };
  }
  return {
    email: row.user.email,
    firstName: row.user.firstName ?? "",
    lastName: row.user.lastName ?? "",
    phone: row.user.phone ?? null,
    userRole: row.user.role,
    companyType: row.company.type,
    departmentId: row.department?.id ?? null,
    roleId: row.role?.id ?? null,
    managerId: row.manager?.id ?? null,
    position: row.position,
    employmentType: (row.employmentType as FormValues["employmentType"]) ?? null,
    workLocation: (row.workLocation as FormValues["workLocation"]) ?? null,
    hireDate: row.hireDate ? new Date(row.hireDate) : null,
    probationEndDate: row.probationEndDate ? new Date(row.probationEndDate) : null,
    birthday: null,
    salary: row.salary ? Number.parseFloat(row.salary) : null,
    salaryCurrency: row.salaryCurrency ?? "USD",
    timezone: row.timezone,
    bio: row.bio,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    skills: row.skills ?? [],
    address: row.address ?? null,
    emergencyContact: row.emergencyContact ?? null,
    status: row.status,
    sendInvite: false,
  };
}
