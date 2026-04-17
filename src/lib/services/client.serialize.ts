import type {
  ClientListResult,
  ClientWithRelations,
} from "@/lib/services/client.service";

export type SerializedClient = Omit<
  ClientWithRelations,
  "mrr" | "arr" | "lifetimeValue" | "signupDate" | "renewalDate" | "churnDate" | "createdAt" | "updatedAt" | "deletedAt"
> & {
  mrr: string | null;
  arr: string | null;
  lifetimeValue: string | null;
  signupDate: string | null;
  renewalDate: string | null;
  churnDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function serializeClient(c: ClientWithRelations): SerializedClient {
  return {
    ...c,
    mrr: c.mrr?.toString() ?? null,
    arr: c.arr?.toString() ?? null,
    lifetimeValue: c.lifetimeValue?.toString() ?? null,
    signupDate: c.signupDate?.toISOString() ?? null,
    renewalDate: c.renewalDate?.toISOString() ?? null,
    churnDate: c.churnDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
  } as SerializedClient;
}

export function serializeClientList(r: ClientListResult) {
  return { ...r, items: r.items.map(serializeClient) };
}
