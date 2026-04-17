"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealKanban } from "./deal-kanban";
import type {
  DealListResponse,
  DealPermissions,
  DealRow,
  PipelineRow,
} from "./types";

export function DealsBoard({
  initial,
  pipelines,
  permissions,
  initialPipelineId,
}: {
  initial: DealListResponse;
  pipelines: PipelineRow[];
  permissions: DealPermissions;
  initialPipelineId: string;
}) {
  const router = useRouter();
  const [pipelineId, setPipelineId] = useState(initialPipelineId);
  const [deals, setDeals] = useState<DealRow[]>(initial.items);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];

  const fetchList = useCallback(
    async (pid: string, q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams({ pipelineId: pid, pageSize: "500" });
        if (q) sp.set("q", q);
        const res = await fetch(`/api/deals?${sp.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const json = (await res.json()) as DealListResponse;
        setDeals(json.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (pipelineId !== initialPipelineId) {
      void fetchList(pipelineId, query);
      const sp = new URLSearchParams();
      sp.set("pipelineId", pipelineId);
      if (query) sp.set("q", query);
      router.replace(`/dashboard/deals?${sp.toString()}`, { scroll: false });
    }
    //
  }, [pipelineId]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query || deals.length > 0) {
        void fetchList(pipelineId, query);
      }
    }, 300);
    return () => clearTimeout(t);
    //
  }, [query]);

  const onMove = useCallback(
    async (args: {
      dealId: string;
      stageId: string;
      prevId: string | null;
      nextId: string | null;
      expectedUpdatedAt: string;
    }) => {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === args.dealId ? { ...d, stageId: args.stageId } : d,
        ),
      );
      const res = await fetch(`/api/deals/${args.dealId}/move`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stageId: args.stageId,
          prevId: args.prevId,
          nextId: args.nextId,
          expectedUpdatedAt: args.expectedUpdatedAt,
        }),
      });
      if (res.status === 409) {
        alert("Position conflict — refreshing");
      }
      await fetchList(pipelineId, query);
    },
    [pipelineId, query, fetchList],
  );

  if (!currentPipeline) {
    return (
      <div className="rounded-xl border border-dashed border-[#1F1F1F] p-12 text-center">
        <p className="text-sm text-[#FAFAFA]">No pipelines configured yet.</p>
      </div>
    );
  }

  const open = deals.filter((d) => d.status === "OPEN");
  const openValue = open.reduce((a, d) => a + Number.parseFloat(d.value), 0);
  const expectedValue = open.reduce(
    (a, d) => a + (Number.parseFloat(d.value) * d.probability) / 100,
    0,
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 flex-wrap">
        <Select value={pipelineId} onValueChange={setPipelineId}>
          <SelectTrigger className="w-64 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.company?.type ?? "Global"} · {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A] pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description, client…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
              Open value
            </p>
            <p className="text-sm font-semibold text-[#FAFAFA]">
              ${formatMoney(openValue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
              Expected
            </p>
            <p className="text-sm font-semibold text-[#F59E0B]">
              ${formatMoney(expectedValue)}
            </p>
          </div>
        </div>

        {permissions.create && (
          <Button size="sm" asChild>
            <Link href={`/dashboard/deals/new?pipelineId=${pipelineId}`}>
              <Plus className="h-4 w-4 mr-1" /> New deal
            </Link>
          </Button>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && deals.length === 0 ? (
        <p className="text-sm text-[#71717A]">Loading…</p>
      ) : (
        <DealKanban
          stages={currentPipeline.stages}
          deals={deals}
          onMove={onMove}
          onOpen={(d) => router.push(`/dashboard/deals/${d.id}`)}
        />
      )}
    </div>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
