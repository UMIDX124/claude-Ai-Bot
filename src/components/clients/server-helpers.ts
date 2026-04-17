import type { User } from "@prisma/client";
import { can } from "@/lib/rbac";
import { listClients } from "@/lib/services/client.service";
import { serializeClientList } from "@/lib/services/client.serialize";
import type {
  ClientFilters,
  ClientListResponse,
  ClientPermissions,
} from "./types";

export function buildClientPermissions(user: User): ClientPermissions {
  return {
    create: can(user, "clients.create"),
    update: can(user, "clients.update"),
    updateAny: can(user, "clients.update.any"),
    delete: can(user, "clients.delete"),
    bulk: can(user, "clients.bulk"),
    export: can(user, "clients.export"),
  };
}

export function toClientListResponse(
  r: Awaited<ReturnType<typeof listClients>>,
): ClientListResponse {
  return serializeClientList(r) as unknown as ClientListResponse;
}

export function clientFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export type { ClientFilters };
