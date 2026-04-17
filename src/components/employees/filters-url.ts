import type { CompanyType, EmployeeStatus } from "@prisma/client";
import type { EmployeeFilters } from "./types";

export function filtersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): EmployeeFilters {
  const sp = params instanceof URLSearchParams ? params : asSearch(params);
  const getAll = (k: string) => sp.getAll(k).filter(Boolean);
  const get = (k: string) => sp.get(k) ?? undefined;

  return {
    q: get("q"),
    company: getAll("company") as CompanyType[],
    departmentId: getAll("departmentId"),
    roleId: getAll("roleId"),
    status: getAll("status") as EmployeeStatus[],
    employmentType: getAll("employmentType"),
    workLocation: getAll("workLocation"),
    managerId: get("managerId") ?? null,
    includeDeleted: get("includeDeleted") === "true",
    onlyDeleted: get("onlyDeleted") === "true",
    sort: get("sort"),
    page: get("page") ? Number.parseInt(get("page")!, 10) : 1,
    pageSize: get("pageSize") ? Number.parseInt(get("pageSize")!, 10) : 25,
  };
}

export function filtersToSearchParams(filters: EmployeeFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const c of filters.company ?? []) sp.append("company", c);
  for (const d of filters.departmentId ?? []) sp.append("departmentId", d);
  for (const r of filters.roleId ?? []) sp.append("roleId", r);
  for (const s of filters.status ?? []) sp.append("status", s);
  for (const e of filters.employmentType ?? []) sp.append("employmentType", e);
  for (const l of filters.workLocation ?? []) sp.append("workLocation", l);
  if (filters.managerId) sp.set("managerId", filters.managerId);
  if (filters.includeDeleted) sp.set("includeDeleted", "true");
  if (filters.onlyDeleted) sp.set("onlyDeleted", "true");
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page && filters.page !== 1) sp.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 25) {
    sp.set("pageSize", String(filters.pageSize));
  }
  return sp;
}

function asSearch(
  obj: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const x of v) sp.append(k, x);
    else sp.set(k, v);
  }
  return sp;
}
