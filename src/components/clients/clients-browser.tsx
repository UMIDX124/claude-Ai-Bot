"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Plus, Search, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientTable } from "./client-table";
import { ClientFiltersSidebar } from "./client-filters";
import { clientFiltersToSearch } from "./filters-url";
import type {
  ClientFilters,
  ClientListResponse,
  ClientPermissions,
  ClientRow,
} from "./types";

export function ClientsBrowser({
  initial,
  initialFilters,
  permissions,
}: {
  initial: ClientListResponse;
  initialFilters: ClientFilters;
  permissions: ClientPermissions;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ClientRow[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [filters, setFilters] = useState<ClientFilters>(initialFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (next: ClientFilters) => {
    setLoading(true);
    setError(null);
    try {
      const sp = clientFiltersToSearch(next);
      const res = await fetch(`/api/clients?${sp.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = (await res.json()) as ClientListResponse;
      setRows(json.items);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncUrl = useCallback(
    (next: ClientFilters) => {
      const sp = clientFiltersToSearch(next);
      router.replace(sp.toString() ? `/dashboard/clients?${sp.toString()}` : "/dashboard/clients", {
        scroll: false,
      });
    },
    [router],
  );

  const updateFilters = useCallback(
    (next: ClientFilters) => {
      const merged = { ...next, page: 1 };
      setFilters(merged);
      setSelected(new Set());
      syncUrl(merged);
      void fetchList(merged);
    },
    [fetchList, syncUrl],
  );

  const resetFilters = useCallback(() => {
    const base: ClientFilters = { page: 1, pageSize: 50 };
    setFilters(base);
    setSelected(new Set());
    syncUrl(base);
    void fetchList(base);
  }, [fetchList, syncUrl]);

  const onBulk = useCallback(
    async (action: {
      action: "delete" | "assign" | "updateStatus" | "updateTier";
      payload?: Record<string, unknown>;
    }) => {
      const ids = Array.from(selected);
      if (!ids.length) return;
      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.action, ids, ...action.payload }),
      });
      if (!res.ok) {
        alert("Bulk action failed");
        return;
      }
      setSelected(new Set());
      await fetchList(filters);
    },
    [selected, filters, fetchList],
  );

  return (
    <div className="flex gap-6">
      <ClientFiltersSidebar
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <div className="flex-1 min-w-0 space-y-4">
        <header className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A] pointer-events-none" />
            <Input
              value={filters.q ?? ""}
              onChange={(e) => updateFilters({ ...filters, q: e.target.value || undefined })}
              placeholder="Search name, legal name, email, industry, city…"
              className="pl-9"
            />
          </div>
          {permissions.export && (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={`/api/clients/export?${clientFiltersToSearch(filters).toString()}`}
                download
              >
                <Download className="h-4 w-4 mr-1.5" /> Export CSV
              </a>
            </Button>
          )}
          {permissions.create && (
            <Button size="sm" asChild>
              <Link href="/dashboard/clients/new">
                <Plus className="h-4 w-4 mr-1.5" /> New client
              </Link>
            </Button>
          )}
        </header>

        <p className="text-xs text-[#71717A]">{total} clients</p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {selected.size > 0 && permissions.bulk && (
          <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-2 flex items-center gap-3 sticky top-2 z-10">
            <span className="text-sm font-medium text-[#F59E0B]">
              {selected.size} selected
            </span>
            <span className="h-4 w-px bg-[#1F1F1F]" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <UserCheck className="h-4 w-4 mr-1.5" /> Change status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["ACTIVE", "PROSPECT", "PAUSED", "CHURNED"] as const).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() =>
                      onBulk({ action: "updateStatus", payload: { status: s } })
                    }
                  >
                    {s.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {permissions.delete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${selected.size} clients?`)) {
                    void onBulk({ action: "delete" });
                  }
                }}
                className="bg-red-500/15 text-red-300 border-red-500/30"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs text-[#71717A] hover:text-[#FAFAFA]"
            >
              Clear
            </button>
          </div>
        )}

        {loading && rows.length === 0 ? (
          <p className="text-sm text-[#71717A]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1F1F1F] p-12 text-center">
            <p className="text-sm text-[#FAFAFA]">No clients match your filters.</p>
            {permissions.create && (
              <Button size="sm" className="mt-4" asChild>
                <Link href="/dashboard/clients/new">Create first client</Link>
              </Button>
            )}
          </div>
        ) : (
          <ClientTable
            rows={rows}
            selected={selected}
            onSelect={(id, v) => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (v) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(v) =>
              setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())
            }
          />
        )}
      </div>
    </div>
  );
}
