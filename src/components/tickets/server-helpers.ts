import type { User } from "@prisma/client";
import { can } from "@/lib/rbac";
import { listTickets } from "@/lib/services/ticket.service";
import { serializeTicketList } from "@/lib/services/ticket.serialize";
import type {
  TicketListResponse,
  TicketPermissions,
} from "./types";

export function buildTicketPermissions(user: User): TicketPermissions {
  return {
    create: can(user, "tickets.create"),
    update: can(user, "tickets.update"),
    updateAny: can(user, "tickets.update.any"),
    delete: can(user, "tickets.delete"),
    bulk: can(user, "tickets.bulk"),
    reply: can(user, "tickets.reply"),
    replyInternal: can(user, "tickets.reply.internal"),
    slaManage: can(user, "slas.manage"),
  };
}

export function toTicketListResponse(
  r: Awaited<ReturnType<typeof listTickets>>,
): TicketListResponse {
  return serializeTicketList(r) as unknown as TicketListResponse;
}

export function ticketFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}
