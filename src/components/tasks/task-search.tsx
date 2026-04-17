"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { TaskRow } from "./types";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";

export function TaskSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({ q: query, pageSize: "20" });
        const res = await fetch(`/api/tasks?${sp.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        setResults(json.items);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh] bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}>
      <Command
        label="Task search"
        shouldFilter={false}
        className="w-full max-w-xl rounded-xl border border-[#1F1F1F] bg-[#111111] shadow-xl overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false);
        }}
      >
        <div className="flex items-center gap-2 border-b border-[#1F1F1F] px-3 py-2.5">
          <Search className="h-4 w-4 text-[#71717A]" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search tasks by title or description…"
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm text-[#FAFAFA] placeholder:text-[#71717A]"
          />
          <kbd className="text-[10px] text-[#71717A] border border-[#1F1F1F] rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-1">
          {loading && (
            <Command.Loading>
              <p className="text-center text-xs text-[#71717A] py-6">Searching…</p>
            </Command.Loading>
          )}
          {!loading && query && results.length === 0 && (
            <Command.Empty className="text-center text-xs text-[#71717A] py-6">
              No matches for "{query}"
            </Command.Empty>
          )}
          {!loading &&
            results.map((t) => (
              <Command.Item
                key={t.id}
                value={t.id}
                onSelect={() => {
                  router.push(`/dashboard/tasks/${t.id}`);
                  onOpenChange(false);
                }}
                className="flex items-start gap-3 rounded-md px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-[#1F1F1F]"
              >
                <TaskPriorityBadge priority={t.priority} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#FAFAFA] truncate">{t.title}</p>
                  <p className="text-[11px] text-[#71717A] truncate">
                    {t.project
                      ? `${t.project.code} · ${t.project.name}`
                      : "No project"}
                  </p>
                </div>
                <TaskStatusBadge status={t.status} />
              </Command.Item>
            ))}
        </Command.List>
      </Command>
    </div>
  );
}
