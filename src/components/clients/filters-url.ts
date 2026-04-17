import type { ClientHealth, ClientStatus, CompanyType } from "@prisma/client";
import type { ClientFilters } from "./types";

export function clientFiltersFromSearch(
  params: Record<string, string | string[] | undefined>,
): ClientFilters {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const x of v) sp.append(k, x);
    else sp.set(k, v);
  }
  const getAll = (k: string) => sp.getAll(k).filter(Boolean);
  const get = (k: string) => sp.get(k) ?? undefined;
  return {
    q: get("q"),
    company: getAll("company") as CompanyType[],
    status: getAll("status") as ClientStatus[],
    health: getAll("health") as ClientHealth[],
    tier: get("tier"),
    ownerEmployeeId: get("ownerEmployeeId"),
    renewalBefore: get("renewalBefore"),
    renewalAfter: get("renewalAfter"),
    includeDeleted: get("includeDeleted") === "true",
    onlyDeleted: get("onlyDeleted") === "true",
    sort: get("sort"),
    page: get("page") ? Number.parseInt(get("page")!, 10) : 1,
    pageSize: get("pageSize") ? Number.parseInt(get("pageSize")!, 10) : 50,
  };
}

function isoOrString(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : v;
}

export function clientFiltersToSearch(filters: ClientFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const c of filters.company ?? []) sp.append("company", c);
  for (const s of filters.status ?? []) sp.append("status", s);
  for (const h of filters.health ?? []) sp.append("health", h);
  if (filters.tier) sp.set("tier", filters.tier);
  if (filters.ownerEmployeeId) sp.set("ownerEmployeeId", filters.ownerEmployeeId);
  if (filters.renewalBefore) sp.set("renewalBefore", isoOrString(filters.renewalBefore));
  if (filters.renewalAfter) sp.set("renewalAfter", isoOrString(filters.renewalAfter));
  if (filters.includeDeleted) sp.set("includeDeleted", "true");
  if (filters.onlyDeleted) sp.set("onlyDeleted", "true");
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page && filters.page !== 1) sp.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 50) {
    sp.set("pageSize", String(filters.pageSize));
  }
  return sp;
}
