"use client";

import type { CompanyType, EmployeeStatus } from "@prisma/client";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { DepartmentOption, EmployeeFilters, RoleOption } from "./types";

const COMPANIES: CompanyType[] = ["DPL", "VCS", "BSL"];
const STATUSES: EmployeeStatus[] = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"] as const;
const LOCATIONS = ["REMOTE", "HYBRID", "ONSITE"] as const;

export function FiltersSidebar({
  filters,
  departments,
  roles,
  onChange,
  onReset,
}: {
  filters: EmployeeFilters;
  departments: DepartmentOption[];
  roles: RoleOption[];
  onChange: (next: EmployeeFilters) => void;
  onReset: () => void;
}) {
  const activeCount = useMemo(() => countActive(filters), [filters]);
  const filteredRoles = useMemo(() => {
    const deptIds = filters.departmentId ?? [];
    if (deptIds.length === 0) return roles;
    return roles.filter((r) => (r.department ? deptIds.includes(r.department.id) : true));
  }, [filters.departmentId, roles]);

  const toggle = <T,>(current: T[] | undefined, value: T): T[] => {
    const arr = current ? [...current] : [];
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value);
    else arr.splice(idx, 1);
    return arr;
  };

  return (
    <aside className="w-64 shrink-0 border-r border-[#1F1F1F] pr-6 space-y-6 text-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
          Filters {activeCount > 0 ? `· ${activeCount}` : ""}
        </h3>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#F59E0B] hover:text-[#E5C158]"
          >
            Reset
          </button>
        ) : null}
      </header>

      <FilterGroup label="Company">
        {COMPANIES.map((c) => {
          const checked = filters.company?.includes(c) ?? false;
          return (
            <FilterRow
              key={c}
              id={`company-${c}`}
              label={c}
              checked={checked}
              onChange={() =>
                onChange({ ...filters, company: toggle(filters.company, c) })
              }
            />
          );
        })}
      </FilterGroup>

      <Separator />

      <FilterGroup label="Status">
        {STATUSES.map((s) => {
          const checked = filters.status?.includes(s) ?? false;
          return (
            <FilterRow
              key={s}
              id={`status-${s}`}
              label={s.replace(/_/g, " ").toLowerCase()}
              checked={checked}
              onChange={() =>
                onChange({ ...filters, status: toggle(filters.status, s) })
              }
              capitalize
            />
          );
        })}
      </FilterGroup>

      <Separator />

      <FilterGroup label="Department">
        {departments.length === 0 ? (
          <p className="text-xs text-[#71717A]">No departments</p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {departments.map((d) => {
              const checked = filters.departmentId?.includes(d.id) ?? false;
              return (
                <FilterRow
                  key={d.id}
                  id={`dept-${d.id}`}
                  label={`${d.company.type} · ${d.name}`}
                  count={d._count.employees}
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...filters,
                      departmentId: toggle(filters.departmentId, d.id),
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </FilterGroup>

      <Separator />

      <FilterGroup label="Role">
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {filteredRoles.slice(0, 40).map((r) => {
            const checked = filters.roleId?.includes(r.id) ?? false;
            return (
              <FilterRow
                key={r.id}
                id={`role-${r.id}`}
                label={r.name}
                count={r._count.employees}
                checked={checked}
                onChange={() =>
                  onChange({
                    ...filters,
                    roleId: toggle(filters.roleId, r.id),
                  })
                }
              />
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup label="Employment">
        {EMPLOYMENT_TYPES.map((t) => {
          const checked = filters.employmentType?.includes(t) ?? false;
          return (
            <FilterRow
              key={t}
              id={`empt-${t}`}
              label={t.replace("_", " ").toLowerCase()}
              checked={checked}
              onChange={() =>
                onChange({
                  ...filters,
                  employmentType: toggle(filters.employmentType, t),
                })
              }
              capitalize
            />
          );
        })}
      </FilterGroup>

      <Separator />

      <FilterGroup label="Location">
        {LOCATIONS.map((l) => {
          const checked = filters.workLocation?.includes(l) ?? false;
          return (
            <FilterRow
              key={l}
              id={`loc-${l}`}
              label={l.toLowerCase()}
              checked={checked}
              onChange={() =>
                onChange({
                  ...filters,
                  workLocation: toggle(filters.workLocation, l),
                })
              }
              capitalize
            />
          );
        })}
      </FilterGroup>

      <Separator />

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#71717A]">Show deleted</span>
        <Button
          variant={filters.includeDeleted ? "default" : "secondary"}
          size="sm"
          onClick={() =>
            onChange({ ...filters, includeDeleted: !filters.includeDeleted })
          }
        >
          {filters.includeDeleted ? "On" : "Off"}
        </Button>
      </div>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterRow({
  id,
  label,
  count,
  checked,
  onChange,
  capitalize,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  capitalize?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-[#161616]"
    >
      <span className="flex items-center gap-2">
        <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
        <span className={capitalize ? "capitalize text-sm" : "text-sm"}>
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="text-[10px] text-[#71717A]">{count}</span>
      ) : null}
    </label>
  );
}

function countActive(f: EmployeeFilters): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.company?.length) n += f.company.length;
  if (f.departmentId?.length) n += f.departmentId.length;
  if (f.roleId?.length) n += f.roleId.length;
  if (f.status?.length) n += f.status.length;
  if (f.employmentType?.length) n += f.employmentType.length;
  if (f.workLocation?.length) n += f.workLocation.length;
  if (f.managerId) n += 1;
  if (f.includeDeleted) n += 1;
  return n;
}
