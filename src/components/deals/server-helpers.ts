import type { User } from "@prisma/client";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import type { DealPermissions, PipelineRow } from "./types";

export function buildDealPermissions(user: User): DealPermissions {
  return {
    create: can(user, "deals.create"),
    update: can(user, "deals.update"),
    updateAny: can(user, "deals.update.any"),
    delete: can(user, "deals.delete"),
    bulk: can(user, "deals.bulk"),
    pipelines: can(user, "pipelines.manage"),
  };
}

export async function loadPipelinesForUi(): Promise<PipelineRow[]> {
  const rows = await db.pipeline.findMany({
    where: { deletedAt: null },
    include: {
      company: { select: { id: true, type: true, name: true } },
      stages: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
      },
      _count: { select: { deals: { where: { deletedAt: null } } } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return rows.map((p) => ({
    ...p,
    stages: p.stages.map((s) => ({
      ...s,
      position: s.position.toString(),
    })),
  })) as unknown as PipelineRow[];
}
