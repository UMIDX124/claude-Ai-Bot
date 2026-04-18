import type {
  TicketListResult,
  TicketWithRelations,
} from "@/lib/services/ticket.service";

export type SerializedTicket = Omit<
  TicketWithRelations,
  | "dueAt"
  | "acknowledgedAt"
  | "firstResponseAt"
  | "resolvedAt"
  | "closedAt"
  | "responseDueAt"
  | "resolutionDueAt"
  | "responseBreachedAt"
  | "resolutionBreachedAt"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> & {
  dueAt: string | null;
  acknowledgedAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  responseBreachedAt: string | null;
  resolutionBreachedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function serializeTicket(t: TicketWithRelations): SerializedTicket {
  return {
    ...t,
    dueAt: t.dueAt?.toISOString() ?? null,
    acknowledgedAt: t.acknowledgedAt?.toISOString() ?? null,
    firstResponseAt: t.firstResponseAt?.toISOString() ?? null,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    closedAt: t.closedAt?.toISOString() ?? null,
    responseDueAt: t.responseDueAt?.toISOString() ?? null,
    resolutionDueAt: t.resolutionDueAt?.toISOString() ?? null,
    responseBreachedAt: t.responseBreachedAt?.toISOString() ?? null,
    resolutionBreachedAt: t.resolutionBreachedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    deletedAt: t.deletedAt?.toISOString() ?? null,
  } as SerializedTicket;
}

export function serializeTicketList(r: TicketListResult) {
  return { ...r, items: r.items.map(serializeTicket) };
}
