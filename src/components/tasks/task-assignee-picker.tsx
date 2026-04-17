"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import type { EmployeeRow } from "@/components/employees/types";
import { cn } from "@/lib/utils";

export function TaskAssigneePicker({
  value,
  onChange,
  employees,
  placeholder = "Unassigned",
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  employees: EmployeeRow[];
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const current = employees.find((e) => e.id === value) ?? null;
  const currentName = current
    ? current.user.fullName ??
      `${current.user.firstName ?? ""} ${current.user.lastName ?? ""}`.trim() ??
      current.user.email
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 60);
    return employees
      .filter((e) => {
        const name = `${e.user.firstName ?? ""} ${e.user.lastName ?? ""} ${e.user.email}`.toLowerCase();
        return name.includes(q);
      })
      .slice(0, 60);
  }, [query, employees]);

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
          {current ? (
            <EmployeeAvatar
              name={currentName}
              url={current.user.avatarUrl}
              size="sm"
            />
          ) : (
            <span className="inline-flex h-7 w-7 rounded-full border border-dashed border-[#3F3F46] grid place-items-center text-[11px] text-[#71717A]">
              <User className="h-3 w-3" />
            </span>
          )}
          <span className="truncate max-w-[160px]">
            {currentName ?? placeholder}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b border-[#1F1F1F] px-3 py-2">
          <Search className="h-4 w-4 text-[#71717A]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#A1A1AA] hover:bg-[#1F1F1F]",
              !value && "text-[#F59E0B]",
            )}
            onClick={() => onChange(null)}
          >
            <span className="inline-flex h-7 w-7 rounded-full border border-dashed border-[#3F3F46] grid place-items-center text-[11px]">
              ?
            </span>
            Unassigned
            {!value ? <Check className="ml-auto h-3 w-3" /> : null}
          </button>
          {filtered.map((e) => {
            const name =
              e.user.fullName ??
              `${e.user.firstName ?? ""} ${e.user.lastName ?? ""}`.trim() ??
              e.user.email;
            return (
              <button
                type="button"
                key={e.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#1F1F1F]",
                  value === e.id && "bg-[#1F1F1F] text-[#F59E0B]",
                )}
                onClick={() => onChange(e.id)}
              >
                <EmployeeAvatar name={name} url={e.user.avatarUrl} size="sm" />
                <span className="flex-1 text-left truncate">{name}</span>
                <span className="text-[10px] text-[#71717A]">
                  {e.company.type}
                </span>
                {value === e.id ? (
                  <Check className="h-3 w-3 text-[#F59E0B]" />
                ) : null}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-[#71717A] py-4">No matches</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
