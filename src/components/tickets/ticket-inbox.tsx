"use client";

import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
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
import {
  TicketChannelIcon,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./ticket-badges";
import type { TicketRow } from "./types";

export function TicketInbox({
  rows,
  selected,
  onSelect,
  onSelectAll,
}: {
  rows: TicketRow[];
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onSelectAll: (v: boolean) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const some = rows.some((r) => selected.has(r.id)) && !allSelected;

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <Checkbox
                checked={allSelected ? true : some ? "indeterminate" : false}
                onCheckedChange={(v) => onSelectAll(Boolean(v))}
              />
            </TableHead>
            <TableHead>#</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>SLA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => {
            const name =
              t.assigneeEmployee?.user.fullName ??
              `${t.assigneeEmployee?.user.firstName ?? ""} ${t.assigneeEmployee?.user.lastName ?? ""}`.trim();
            const breaching =
              t.responseBreachedAt ||
              t.resolutionBreachedAt;
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
                <TableCell className="font-mono text-xs text-[#F59E0B]">
                  #{t.number}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="group block"
                  >
                    <p className="font-medium text-[#FAFAFA] group-hover:text-[#F59E0B]">
                      {t.subject}
                    </p>
                    {t.category && (
                      <p className="text-[10px] text-[#71717A] uppercase tracking-wider">
                        {t.category}
                      </p>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  {t.client ? (
                    <Link
                      href={`/dashboard/clients/${t.client.id}`}
                      className="text-xs text-[#A1A1AA] hover:text-[#F59E0B]"
                    >
                      {t.client.name}
                    </Link>
                  ) : (
                    <span className="text-[#71717A] text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={t.priority} />
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <TicketChannelIcon channel={t.channel} />
                </TableCell>
                <TableCell className="text-xs">
                  {t.assigneeEmployee ? (
                    <span className="inline-flex items-center gap-1.5">
                      <EmployeeAvatar
                        name={name}
                        url={t.assigneeEmployee.user.avatarUrl}
                        size="sm"
                      />
                      <span>{name}</span>
                    </span>
                  ) : (
                    <span className="text-[#71717A]">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-[#A1A1AA]">
                  {format(new Date(t.createdAt), "MMM d, HH:mm")}
                </TableCell>
                <TableCell>
                  {breaching ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                      <AlertTriangle className="h-3 w-3" /> breaching
                    </span>
                  ) : t.responseDueAt && !t.firstResponseAt ? (
                    <span className="text-[11px] text-[#A1A1AA]">
                      response {remaining(t.responseDueAt)}
                    </span>
                  ) : t.resolutionDueAt && !t.resolvedAt ? (
                    <span className="text-[11px] text-[#A1A1AA]">
                      resolve {remaining(t.resolutionDueAt)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#71717A]">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function remaining(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  const text = hours > 0 ? `${hours}h` : `${mins}m`;
  return diff < 0 ? `${text} late` : `in ${text}`;
}
