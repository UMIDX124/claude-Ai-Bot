"use client";

import type {
  CompanyType,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { FilterX, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { TicketFilters } from "./types";

const COMPANIES: CompanyType[] = ["DPL", "VCS", "BSL"];
const STATUSES: TicketStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];
const PRIORITIES: TicketPriority[] = ["CRITICAL", "URGENT", "HIGH", "NORMAL", "LOW"];
const CHANNELS: TicketChannel[] = ["EMAIL", "WEB", "CHAT", "PHONE", "INTERNAL"];

export function TicketFiltersSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: TicketFilters;
  onChange: (next: TicketFilters) => void;
  onReset: () => void;
}) {
  const toggle = <T,>(current: T[] | undefined, v: T): T[] => {
    const arr = current ? [...current] : [];
    const i = arr.indexOf(v);
    if (i === -1) arr.push(v);
    else arr.splice(i, 1);
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

      <Group label="Quick">
        <Row
          label="Assigned to me"
          checked={filters.assigneeEmployeeId === "me"}
          onChange={() =>
            onChange({
              ...filters,
              assigneeEmployeeId:
                filters.assigneeEmployeeId === "me" ? undefined : "me",
            })
          }
        />
        <Row
          label="Unassigned"
          checked={filters.assigneeEmployeeId === "unassigned"}
          onChange={() =>
            onChange({
              ...filters,
              assigneeEmployeeId:
                filters.assigneeEmployeeId === "unassigned"
                  ? undefined
                  : "unassigned",
            })
          }
        />
        <Row
          label={
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-400" /> SLA breaching
            </span>
          }
          checked={filters.slaBreaching ?? false}
          onChange={() =>
            onChange({ ...filters, slaBreaching: !filters.slaBreaching })
          }
        />
        <Row
          label="Include closed"
          checked={filters.includeClosed !== false}
          onChange={() =>
            onChange({
              ...filters,
              includeClosed: !(filters.includeClosed !== false),
            })
          }
        />
      </Group>

      <Separator />

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
            label={s.replace(/_/g, " ").toLowerCase()}
            checked={filters.status?.includes(s) ?? false}
            capitalize
            onChange={() =>
              onChange({ ...filters, status: toggle(filters.status, s) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Priority">
        {PRIORITIES.map((p) => (
          <Row
            key={p}
            label={p.toLowerCase()}
            capitalize
            checked={filters.priority?.includes(p) ?? false}
            onChange={() =>
              onChange({ ...filters, priority: toggle(filters.priority, p) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Channel">
        {CHANNELS.map((c) => (
          <Row
            key={c}
            label={c.toLowerCase()}
            capitalize
            checked={filters.channel?.includes(c) ?? false}
            onChange={() =>
              onChange({ ...filters, channel: toggle(filters.channel, c) })
            }
          />
        ))}
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
  label: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  capitalize?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-[#161616]">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className={capitalize ? "capitalize text-sm" : "text-sm"}>
        {label}
      </span>
    </label>
  );
}

function activeCount(f: TicketFilters): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.company?.length) n += f.company.length;
  if (f.status?.length) n += f.status.length;
  if (f.priority?.length) n += f.priority.length;
  if (f.channel?.length) n += f.channel.length;
  if (f.assigneeEmployeeId) n += 1;
  if (f.slaBreaching) n += 1;
  if (f.includeClosed === false) n += 1;
  return n;
}
