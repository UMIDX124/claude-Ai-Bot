import type {
  CompanyType,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import type { TicketFilters } from "./types";

export function ticketFiltersFromSearch(
  params: Record<string, string | string[] | undefined>,
): TicketFilters {
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
    status: getAll("status") as TicketStatus[],
    priority: getAll("priority") as TicketPriority[],
    channel: getAll("channel") as TicketChannel[],
    clientId: get("clientId"),
    assigneeEmployeeId: get("assigneeEmployeeId") as TicketFilters["assigneeEmployeeId"],
    slaBreaching: get("slaBreaching") === "true",
    includeClosed: get("includeClosed") !== "false",
    includeDeleted: get("includeDeleted") === "true",
    sort: get("sort"),
    page: get("page") ? Number.parseInt(get("page")!, 10) : 1,
    pageSize: get("pageSize") ? Number.parseInt(get("pageSize")!, 10) : 50,
  };
}

export function ticketFiltersToSearch(filters: TicketFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const c of filters.company ?? []) sp.append("company", c);
  for (const s of filters.status ?? []) sp.append("status", s);
  for (const p of filters.priority ?? []) sp.append("priority", p);
  for (const ch of filters.channel ?? []) sp.append("channel", ch);
  if (filters.clientId) sp.set("clientId", filters.clientId);
  if (filters.assigneeEmployeeId) sp.set("assigneeEmployeeId", filters.assigneeEmployeeId);
  if (filters.slaBreaching) sp.set("slaBreaching", "true");
  if (filters.includeClosed === false) sp.set("includeClosed", "false");
  if (filters.includeDeleted) sp.set("includeDeleted", "true");
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.page && filters.page !== 1) sp.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 50) {
    sp.set("pageSize", String(filters.pageSize));
  }
  return sp;
}
