import type { TaskFilters } from "./types";

export function filtersFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): TaskFilters {
  const sp = params instanceof URLSearchParams ? params : asSearch(params);
  const getAll = (k: string) => sp.getAll(k).filter(Boolean);
  const get = (k: string) => sp.get(k) ?? undefined;

  return {
    q: get("q"),
    projectId: getAll("projectId"),
    status: getAll("status") as TaskFilters["status"],
    priority: getAll("priority") as TaskFilters["priority"],
    assigneeEmployeeId: get("assigneeEmployeeId") as TaskFilters["assigneeEmployeeId"],
    reporterEmployeeId: get("reporterEmployeeId"),
    labelIds: getAll("labelIds"),
    dueBefore: get("dueBefore"),
    dueAfter: get("dueAfter"),
    includeCompleted: get("includeCompleted") !== "false",
    includeDeleted: get("includeDeleted") === "true",
    onlyDeleted: get("onlyDeleted") === "true",
    sort: get("sort"),
    page: get("page") ? Number.parseInt(get("page")!, 10) : 1,
    pageSize: get("pageSize") ? Number.parseInt(get("pageSize")!, 10) : 100,
  };
}

export function filtersToSearchParams(filters: TaskFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const p of filters.projectId ?? []) sp.append("projectId", p);
  for (const s of filters.status ?? []) sp.append("status", s);
  for (const p of filters.priority ?? []) sp.append("priority", p);
  if (filters.assigneeEmployeeId) {
    if (Array.isArray(filters.assigneeEmployeeId)) {
      for (const a of filters.assigneeEmployeeId) sp.append("assigneeEmployeeId", a);
    } else {
      sp.set("assigneeEmployeeId", filters.assigneeEmployeeId);
    }
  }
  if (filters.reporterEmployeeId) sp.set("reporterEmployeeId", filters.reporterEmployeeId);
  for (const l of filters.labelIds ?? []) sp.append("labelIds", l);
  if (filters.dueBefore) sp.set("dueBefore", isoOrString(filters.dueBefore));
  if (filters.dueAfter) sp.set("dueAfter", isoOrString(filters.dueAfter));
  if (filters.includeCompleted === false) sp.set("includeCompleted", "false");
  if (filters.includeDeleted) sp.set("includeDeleted", "true");
  if (filters.onlyDeleted) sp.set("onlyDeleted", "true");
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page && filters.page !== 1) sp.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 100) {
    sp.set("pageSize", String(filters.pageSize));
  }
  return sp;
}

function isoOrString(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : v;
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
