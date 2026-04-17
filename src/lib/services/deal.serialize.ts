import type {
  DealListResult,
  DealWithRelations,
} from "@/lib/services/deal.service";

export type SerializedDeal = Omit<
  DealWithRelations,
  "value" | "position" | "expectedClose" | "nextStepAt" | "closedAt" | "createdAt" | "updatedAt" | "deletedAt"
> & {
  value: string;
  position: string;
  expectedClose: string | null;
  nextStepAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function serializeDeal(d: DealWithRelations): SerializedDeal {
  return {
    ...d,
    value: d.value.toString(),
    position: d.position.toString(),
    expectedClose: d.expectedClose?.toISOString() ?? null,
    nextStepAt: d.nextStepAt?.toISOString() ?? null,
    closedAt: d.closedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    deletedAt: d.deletedAt?.toISOString() ?? null,
  } as SerializedDeal;
}

export function serializeDealList(r: DealListResult) {
  return { ...r, items: r.items.map(serializeDeal) };
}
