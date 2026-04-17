"use client";

import { useState } from "react";
import { Check, Plus, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaskLabelLite } from "./types";

export function TaskLabelPicker({
  value,
  onChange,
  available,
  onCreate,
  className,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  available: TaskLabelLite[];
  onCreate?: (name: string) => Promise<TaskLabelLite | null>;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = available.filter((l) =>
    l.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const exists = available.some(
    (l) => l.name.toLowerCase() === query.trim().toLowerCase(),
  );

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-2 py-1.5 text-sm text-[#FAFAFA]",
            "hover:border-[#F59E0B]/40 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40",
            className,
          )}
        >
          <Tag className="h-3 w-3 text-[#71717A]" />
          <span>
            Labels{" "}
            {value.length > 0 && (
              <span className="text-[#F59E0B]">· {value.length}</span>
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-0">
        <div className="border-b border-[#1F1F1F] p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find or create label…"
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.map((l) => {
            const checked = value.includes(l.id);
            return (
              <button
                type="button"
                key={l.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#1F1F1F]",
                  checked && "bg-[#1F1F1F]",
                )}
                onClick={() => toggle(l.id)}
              >
                <span
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: l.color }}
                />
                <span className="flex-1 text-left">{l.name}</span>
                {checked ? (
                  <Check className="h-3 w-3 text-[#F59E0B]" />
                ) : null}
              </button>
            );
          })}
          {!exists && query.trim() && onCreate && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#F59E0B] hover:bg-[#1F1F1F]"
              onClick={async () => {
                const created = await onCreate(query.trim());
                if (created) {
                  onChange([...value, created.id]);
                  setQuery("");
                }
              }}
            >
              <Plus className="h-3 w-3" />
              Create "{query}"
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
