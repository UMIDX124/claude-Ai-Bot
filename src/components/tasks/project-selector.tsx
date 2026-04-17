"use client";

import { useState } from "react";
import { Check, ChevronDown, Folder, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProjectRow } from "./types";

export function ProjectSelector({
  value,
  onChange,
  projects,
  allowNone = true,
  placeholder = "All projects",
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  projects: ProjectRow[];
  allowNone?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const current = projects.find((p) => p.id === value) ?? null;
  const filtered = projects.filter((p) =>
    `${p.name} ${p.code}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-1.5 text-sm text-[#FAFAFA]",
            "hover:border-[#F59E0B]/40",
            className,
          )}
        >
          {current ? (
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: current.color ?? "#F59E0B" }}
            />
          ) : (
            <Folder className="h-3 w-3 text-[#71717A]" />
          )}
          <span className="truncate max-w-[180px]">
            {current ? `${current.code} · ${current.name}` : placeholder}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b border-[#1F1F1F] px-3 py-2">
          <Search className="h-4 w-4 text-[#71717A]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {allowNone && (
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#1F1F1F]",
                !value && "text-[#F59E0B]",
              )}
              onClick={() => onChange(null)}
            >
              <span className="h-2.5 w-2.5 rounded-sm bg-[#3F3F46]" />
              <span className="flex-1 text-left">All projects</span>
              {!value ? <Check className="h-3 w-3" /> : null}
            </button>
          )}
          {filtered.map((p) => {
            const checked = value === p.id;
            return (
              <button
                type="button"
                key={p.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#1F1F1F]",
                  checked && "bg-[#1F1F1F] text-[#F59E0B]",
                )}
                onClick={() => onChange(p.id)}
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: p.color ?? "#F59E0B" }}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[10px] text-[#71717A] uppercase tracking-wider">
                    {p.code} · {p.company.type}
                  </p>
                </div>
                <span className="text-[10px] text-[#71717A]">
                  {p._count.tasks}
                </span>
                {checked ? <Check className="h-3 w-3" /> : null}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-[#71717A] py-4">
              No projects
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
