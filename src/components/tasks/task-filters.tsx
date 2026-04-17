"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { FilterX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./task-status-badge";
import { PRIORITY_META } from "./task-priority-badge";
import type { ProjectRow, TaskFilters, TaskLabelLite } from "./types";

const STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
];
const PRIORITIES: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function TaskFiltersSidebar({
  filters,
  projects,
  labels,
  onChange,
  onReset,
  className,
}: {
  filters: TaskFilters;
  projects: ProjectRow[];
  labels: TaskLabelLite[];
  onChange: (next: TaskFilters) => void;
  onReset: () => void;
  className?: string;
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
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-[#1F1F1F] pr-5 space-y-5 text-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
          Filters {count > 0 ? `· ${count}` : ""}
        </h3>
        {count > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-[#F59E0B] hover:text-[#E5C158] inline-flex items-center gap-1"
          >
            <FilterX className="h-3 w-3" />
            Reset
          </button>
        ) : null}
      </header>

      <Group label="Assignee">
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
      </Group>

      <Separator />

      <Group label="Project">
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {projects.map((p) => (
            <Row
              key={p.id}
              label={`${p.code} · ${p.name}`}
              color={p.color ?? undefined}
              checked={filters.projectId?.includes(p.id) ?? false}
              count={p._count.tasks}
              onChange={() =>
                onChange({
                  ...filters,
                  projectId: toggle(filters.projectId, p.id),
                })
              }
            />
          ))}
        </div>
      </Group>

      <Separator />

      <Group label="Status">
        {STATUSES.map((s) => (
          <Row
            key={s}
            label={STATUS_META[s].label}
            dot={STATUS_META[s].dot}
            checked={filters.status?.includes(s) ?? false}
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
            label={PRIORITY_META[p].label}
            dot={PRIORITY_META[p].dot}
            checked={filters.priority?.includes(p) ?? false}
            onChange={() =>
              onChange({ ...filters, priority: toggle(filters.priority, p) })
            }
          />
        ))}
      </Group>

      <Separator />

      <Group label="Labels">
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {labels.map((l) => (
            <Row
              key={l.id}
              label={l.name}
              color={l.color}
              checked={filters.labelIds?.includes(l.id) ?? false}
              onChange={() =>
                onChange({
                  ...filters,
                  labelIds: toggle(filters.labelIds, l.id),
                })
              }
            />
          ))}
          {labels.length === 0 && (
            <p className="text-[11px] text-[#71717A]">No labels yet</p>
          )}
        </div>
      </Group>

      <Separator />

      <Group label="Due">
        <div className="space-y-2">
          <label className="space-y-1 block">
            <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
              After
            </span>
            <Input
              type="date"
              value={dateInputValue(filters.dueAfter)}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dueAfter: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </label>
          <label className="space-y-1 block">
            <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
              Before
            </span>
            <Input
              type="date"
              value={dateInputValue(filters.dueBefore)}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dueBefore: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </label>
        </div>
      </Group>

      <Separator />

      <Group label="Flags">
        <Row
          label="Include completed"
          checked={filters.includeCompleted !== false}
          onChange={() =>
            onChange({
              ...filters,
              includeCompleted: !(filters.includeCompleted !== false),
            })
          }
        />
        <Row
          label="Show deleted"
          checked={filters.includeDeleted ?? false}
          onChange={() =>
            onChange({ ...filters, includeDeleted: !filters.includeDeleted })
          }
        />
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
  dot,
  color,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  dot?: string;
  color?: string;
  count?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-[#161616]">
      <span className="flex items-center gap-2 min-w-0">
        <Checkbox checked={checked} onCheckedChange={onChange} />
        {dot ? (
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        ) : color ? (
          <span
            className="h-2 w-2 rounded"
            style={{ backgroundColor: color }}
          />
        ) : null}
        <span className="truncate text-sm">{label}</span>
      </span>
      {typeof count === "number" ? (
        <span className="text-[10px] text-[#71717A]">{count}</span>
      ) : null}
    </label>
  );
}

function activeCount(f: TaskFilters): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.projectId?.length) n += f.projectId.length;
  if (f.status?.length) n += f.status.length;
  if (f.priority?.length) n += f.priority.length;
  if (f.labelIds?.length) n += f.labelIds.length;
  if (f.assigneeEmployeeId) n += 1;
  if (f.dueBefore || f.dueAfter) n += 1;
  if (f.includeDeleted) n += 1;
  return n;
}

function dateInputValue(v: string | Date | undefined): string {
  if (!v) return "";
  const iso = v instanceof Date ? v.toISOString() : v;
  return iso.slice(0, 10);
}

// Unused dummy to silence Button import — keeps barrel re-exports happy
export const __ensureButtonTree = Button;
