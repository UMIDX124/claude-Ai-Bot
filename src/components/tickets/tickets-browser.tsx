"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TicketFiltersSidebar } from "./ticket-filters";
import { TicketInbox } from "./ticket-inbox";
import { ticketFiltersToSearch } from "./filters-url";
import type {
  TicketFilters,
  TicketListResponse,
  TicketPermissions,
  TicketRow,
} from "./types";

export function TicketsBrowser({
  initial,
  initialFilters,
  permissions,
}: {
  initial: TicketListResponse;
  initialFilters: TicketFilters;
  permissions: TicketPermissions;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<TicketRow[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [filters, setFilters] = useState<TicketFilters>(initialFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (next: TicketFilters) => {
    setLoading(true);
    setError(null);
    try {
      const sp = ticketFiltersToSearch(next);
      const res = await fetch(`/api/tickets?${sp.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const j = (await res.json()) as TicketListResponse;
      setRows(j.items);
      setTotal(j.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncUrl = useCallback(
    (next: TicketFilters) => {
      const sp = ticketFiltersToSearch(next);
      router.replace(sp.toString() ? `/dashboard/tickets?${sp.toString()}` : "/dashboard/tickets", {
        scroll: false,
      });
    },
    [router],
  );

  const updateFilters = useCallback(
    (next: TicketFilters) => {
      const merged = { ...next, page: 1 };
      setFilters(merged);
      setSelected(new Set());
      syncUrl(merged);
      void fetchList(merged);
    },
    [fetchList, syncUrl],
  );

  const resetFilters = useCallback(() => {
    const base: TicketFilters = { page: 1, pageSize: 50 };
    setFilters(base);
    setSelected(new Set());
    syncUrl(base);
    void fetchList(base);
  }, [fetchList, syncUrl]);

  const onBulk = useCallback(
    async (payload: Record<string, unknown>) => {
      const ids = Array.from(selected);
      if (!ids.length) return;
      const res = await fetch("/api/tickets/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, ids }),
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
      <TicketFiltersSidebar
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
              placeholder="Search subject, description, category…"
              className="pl-9"
            />
          </div>
          {permissions.create && (
            <Button size="sm" asChild>
              <Link href="/dashboard/tickets/new">
                <Plus className="h-4 w-4 mr-1" /> New ticket
              </Link>
            </Button>
          )}
        </header>

        <p className="text-xs text-[#71717A]">{total} tickets</p>

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
                {(["ACKNOWLEDGED", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const).map(
                  (s) => (
                    <DropdownMenuItem
                      key={s}
                      onSelect={() => onBulk({ action: "updateStatus", status: s })}
                    >
                      {s.replace(/_/g, " ").toLowerCase()}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {permissions.delete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${selected.size} tickets?`)) {
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
            <p className="text-sm text-[#FAFAFA]">No tickets match.</p>
            {permissions.create && (
              <Button size="sm" className="mt-4" asChild>
                <Link href="/dashboard/tickets/new">Create first ticket</Link>
              </Button>
            )}
          </div>
        ) : (
          <TicketInbox
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
