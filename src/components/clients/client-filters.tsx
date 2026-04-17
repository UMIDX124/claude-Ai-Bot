"use client";

import type { ClientHealth, ClientStatus, CompanyType } from "@prisma/client";
import { FilterX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import type { ClientFilters } from "./types";

const COMPANIES: CompanyType[] = ["DPL", "VCS", "BSL"];
const STATUSES: ClientStatus[] = ["ACTIVE", "PROSPECT", "PAUSED", "CHURNED"];
const HEALTHS: ClientHealth[] = ["HEALTHY", "AT_RISK", "CHURNING", "UNKNOWN"];

export function ClientFiltersSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: ClientFilters;
  onChange: (next: ClientFilters) => void;
  onReset: () => void;
}) {
  const toggle = <T,>(current: T[] | undefined, value: T): T[] => {
    const arr = current ? [...current] : [];
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value);
    else arr.splice(idx, 1);
    return arr;
  };
  const count = activeCount(filters);

  return (
    <aside className="w-56 shrink-0 border-r border-[#1F1F1F] pr-5 space-y-5 text-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
          Filters {count > 0 ? `· ${count}` : ""}
        </h3>
        {count > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-[#F59E0B] hover:text-[#E5C158] inline-flex items-center gap-1"
          >
            <FilterX className="h-3 w-3" /> Reset
          </button>
        )}
      </header>

      <Group label="Company">
        {COMPANIES.map((c) => (
          <Row
            key={c}
            label={c}
            checked={filters.company?.includes(c) ?? false}
            onChange={() =>
              onChange({ ...filters, company: toggle(filters.company, c) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Status">
        {STATUSES.map((s) => (
          <Row
            key={s}
            label={s.toLowerCase()}
            capitalize
            checked={filters.status?.includes(s) ?? false}
            onChange={() =>
              onChange({ ...filters, status: toggle(filters.status, s) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Health">
        {HEALTHS.map((h) => (
          <Row
            key={h}
            label={h.replace("_", " ").toLowerCase()}
            capitalize
            checked={filters.health?.includes(h) ?? false}
            onChange={() =>
              onChange({ ...filters, health: toggle(filters.health, h) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Tier">
        <Input
          placeholder="Enterprise, Growth…"
          value={filters.tier ?? ""}
          onChange={(e) =>
            onChange({ ...filters, tier: e.target.value || undefined })
          }
        />
      </Group>

      <Separator />

      <Group label="Renewal window">
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
            After
          </span>
          <Input
            type="date"
            value={dateInputValue(filters.renewalAfter)}
            onChange={(e) =>
              onChange({
                ...filters,
                renewalAfter: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </label>
        <label className="block space-y-1 mt-2">
          <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
            Before
          </span>
          <Input
            type="date"
            value={dateInputValue(filters.renewalBefore)}
            onChange={(e) =>
              onChange({
                ...filters,
                renewalBefore: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </label>
      </Group>
    </aside>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({
  label,
  checked,
  onChange,
  capitalize,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  capitalize?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-[#161616]">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className={capitalize ? "capitalize text-sm" : "text-sm"}>{label}</span>
    </label>
  );
}

function dateInputValue(v: string | Date | undefined): string {
  if (!v) return "";
  const iso = v instanceof Date ? v.toISOString() : v;
  return iso.slice(0, 10);
}

function activeCount(f: ClientFilters): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.company?.length) n += f.company.length;
  if (f.status?.length) n += f.status.length;
  if (f.health?.length) n += f.health.length;
  if (f.tier) n += 1;
  if (f.renewalBefore || f.renewalAfter) n += 1;
  return n;
}
