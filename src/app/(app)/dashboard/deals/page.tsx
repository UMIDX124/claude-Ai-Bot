import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listDeals } from "@/lib/services/deal.service";
import { serializeDealList } from "@/lib/services/deal.serialize";
import { can } from "@/lib/rbac";
import { DealsBoard } from "@/components/deals/deals-board";
import {
  buildDealPermissions,
  loadPipelinesForUi,
} from "@/components/deals/server-helpers";
import type { DealListResponse } from "@/components/deals/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  if (!can(user, "deals.read")) {
    return <p className="text-sm text-[#71717A]">No access to deals.</p>;
  }

  const pipelines = await loadPipelinesForUi();
  if (pipelines.length === 0) {
    return (
      <div className="max-w-4xl mx-auto rounded-xl border border-dashed border-[#1F1F1F] p-12 text-center">
        <p className="text-sm text-[#FAFAFA]">
          No pipelines yet. Run <code className="text-[#F59E0B]">pnpm db:seed:slice3</code> or create one.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const requestedPipelineId = typeof params.pipelineId === "string" ? params.pipelineId : null;
  const pipeline = pipelines.find((p) => p.id === requestedPipelineId) ?? pipelines[0];

  if (!requestedPipelineId) {
    redirect(`/dashboard/deals?pipelineId=${pipeline.id}`);
  }

  const result = await listDeals(user, {
    pipelineId: pipeline.id,
    page: 1,
    pageSize: 500,
    sort: "position",
    includeDeleted: false,
    onlyDeleted: false,
  });

  const initial = serializeDealList(result) as unknown as DealListResponse;

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Deals
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {result.total} deals · drag between stages to reassign
          </p>
        </div>
      </header>
      <DealsBoard
        initial={initial}
        pipelines={pipelines}
        permissions={buildDealPermissions(user)}
        initialPipelineId={pipeline.id}
      />
    </div>
  );
}
