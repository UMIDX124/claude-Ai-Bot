"use client";

import Link from "next/link";
import Image from "next/image";
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
import { ClientStatusBadge } from "./client-status-badge";
import { ClientHealthBadge } from "./client-health-badge";
import type { ClientRow } from "./types";

export function ClientTable({
  rows,
  selected,
  onSelect,
  onSelectAll,
}: {
  rows: ClientRow[];
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onSelectAll: (v: boolean) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id)) && !allSelected;

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
            <TableHead>Client</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Health</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead>Renewal</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const ownerName =
              c.ownerEmployee?.user.fullName ??
              `${c.ownerEmployee?.user.firstName ?? ""} ${c.ownerEmployee?.user.lastName ?? ""}`.trim();
            return (
              <TableRow
                key={c.id}
                data-state={selected.has(c.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(c.id)}
                    onCheckedChange={(v) => onSelect(c.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/clients/${c.id}`}
                    className="flex items-center gap-2 group"
                  >
                    {c.logoUrl ? (
                      <Image
                        src={c.logoUrl}
                        alt={c.name}
                        width={32}
                        height={32}
                        className="rounded-md bg-[#1F1F1F] object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] grid place-items-center text-xs font-bold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-[#FAFAFA] group-hover:text-[#F59E0B]">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-[#71717A]">
                        {c.industry ?? c.website ?? c.email ?? "—"}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B]">
                    {c.company.type}
                  </span>
                </TableCell>
                <TableCell className="text-[#A1A1AA]">
                  {c.accountTier ?? "—"}
                </TableCell>
                <TableCell>
                  <ClientStatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <ClientHealthBadge health={c.health} score={c.healthScore} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {c.mrr
                    ? `$${Number.parseFloat(c.mrr).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-[#A1A1AA]">
                  {c.renewalDate
                    ? format(new Date(c.renewalDate), "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {ownerName ? (
                    <span className="text-[#A1A1AA]">{ownerName}</span>
                  ) : (
                    <span className="text-[#71717A]">Unassigned</span>
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
