"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import type { TaskRow } from "./types";

export function TaskListView({
  tasks,
  selected,
  onSelect,
  onSelectAll,
}: {
  tasks: TaskRow[];
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onSelectAll: (v: boolean) => void;
}) {
  const allSelected = tasks.length > 0 && tasks.every((t) => selected.has(t.id));
  const someSelected = tasks.some((t) => selected.has(t.id)) && !allSelected;

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => onSelectAll(Boolean(v))}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Labels</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const assigneeName =
              t.assignee?.user.fullName ??
              `${t.assignee?.user.firstName ?? ""} ${t.assignee?.user.lastName ?? ""}`.trim();
            return (
              <TableRow
                key={t.id}
                data-state={selected.has(t.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(t.id)}
                    onCheckedChange={(v) => onSelect(t.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/tasks/${t.id}`}
                    className="font-medium text-[#FAFAFA] hover:text-[#F59E0B]"
                  >
                    {t.title}
                  </Link>
                  {t.description ? (
                    <p className="text-[11px] text-[#71717A] line-clamp-1">
                      {t.description}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  {t.project ? (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ backgroundColor: t.project.color ?? "#F59E0B" }}
                      />
                      {t.project.code}
                    </span>
                  ) : (
                    <span className="text-[#71717A]">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={t.priority} variant="full" />
                </TableCell>
                <TableCell>
                  {t.assignee ? (
                    <span className="inline-flex items-center gap-2">
                      <EmployeeAvatar
                        name={assigneeName}
                        url={t.assignee.user.avatarUrl}
                        size="sm"
                      />
                      <span className="text-xs">{assigneeName}</span>
                    </span>
                  ) : (
                    <span className="text-[#71717A] text-xs">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex flex-wrap gap-1 justify-end">
                    {t.labels.slice(0, 3).map(({ label }) => (
                      <span
                        key={label.id}
                        className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${label.color}22`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
