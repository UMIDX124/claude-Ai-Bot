"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2, Edit3, Eye, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { EmployeeAvatar } from "./EmployeeAvatar";
import type { EmployeeRow } from "./types";

type Column = "code" | "employee" | "company" | "department" | "role" | "manager" | "status" | "salary" | "hireDate";

const DEFAULT_COLUMNS: Column[] = [
  "code",
  "employee",
  "company",
  "department",
  "role",
  "manager",
  "status",
  "salary",
  "hireDate",
];

export function EmployeeTable({
  rows,
  selected,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onRestore,
  columns = DEFAULT_COLUMNS,
}: {
  rows: EmployeeRow[];
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onSelectAll: (v: boolean) => void;
  onEdit?: (row: EmployeeRow) => void;
  onDelete?: (row: EmployeeRow) => void;
  onRestore?: (row: EmployeeRow) => void;
  columns?: Column[];
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected =
    rows.some((r) => selected.has(r.id)) && !allSelected;

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
            {columns.includes("code") ? <TableHead>Code</TableHead> : null}
            {columns.includes("employee") ? <TableHead>Employee</TableHead> : null}
            {columns.includes("company") ? <TableHead>Company</TableHead> : null}
            {columns.includes("department") ? <TableHead>Department</TableHead> : null}
            {columns.includes("role") ? <TableHead>Role</TableHead> : null}
            {columns.includes("manager") ? <TableHead>Manager</TableHead> : null}
            {columns.includes("status") ? <TableHead>Status</TableHead> : null}
            {columns.includes("salary") ? <TableHead className="text-right">Salary</TableHead> : null}
            {columns.includes("hireDate") ? <TableHead>Hired</TableHead> : null}
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelected = selected.has(row.id);
            const name =
              row.user.fullName ??
              [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") ??
              row.user.email;
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                className={row.deletedAt ? "opacity-60" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onSelect(row.id, Boolean(v))}
                  />
                </TableCell>
                {columns.includes("code") ? (
                  <TableCell className="font-mono text-xs text-[#F59E0B]">
                    {row.employeeCode ?? "—"}
                  </TableCell>
                ) : null}
                {columns.includes("employee") ? (
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${row.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <EmployeeAvatar name={name} url={row.user.avatarUrl} size="sm" />
                      <div>
                        <p className="font-medium text-[#FAFAFA] group-hover:text-[#F59E0B] transition-colors">
                          {name}
                        </p>
                        <p className="text-[11px] text-[#71717A]">{row.user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                ) : null}
                {columns.includes("company") ? (
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B]">
                      {row.company.type}
                    </span>
                  </TableCell>
                ) : null}
                {columns.includes("department") ? (
                  <TableCell>
                    {row.department ? (
                      <span className="inline-flex items-center gap-1.5">
                        {row.department.color ? (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: row.department.color }}
                          />
                        ) : null}
                        <span>{row.department.name}</span>
                      </span>
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                ) : null}
                {columns.includes("role") ? (
                  <TableCell>
                    {row.role ? (
                      <span>
                        {row.role.name}
                        {row.role.seniority ? (
                          <span className="ml-1 text-[10px] text-[#71717A] uppercase">
                            {row.role.seniority}
                          </span>
                        ) : null}
                      </span>
                    ) : row.position ? (
                      row.position
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                ) : null}
                {columns.includes("manager") ? (
                  <TableCell>
                    {row.manager ? (
                      <span className="text-[#A1A1AA]">
                        {row.manager.user.fullName ??
                          row.manager.user.email.split("@")[0]}
                      </span>
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                ) : null}
                {columns.includes("status") ? (
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                ) : null}
                {columns.includes("salary") ? (
                  <TableCell className="text-right font-mono text-sm">
                    {row.salaryVisible ? (
                      row.salary ? (
                        <span className="text-[#FAFAFA]">
                          {row.salaryCurrency} {formatSalary(row.salary)}
                        </span>
                      ) : (
                        <span className="text-[#71717A]">—</span>
                      )
                    ) : (
                      <span className="text-[#71717A]">•••••</span>
                    )}
                  </TableCell>
                ) : null}
                {columns.includes("hireDate") ? (
                  <TableCell className="text-[#A1A1AA] text-sm">
                    {row.hireDate
                      ? new Date(row.hireDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </TableCell>
                ) : null}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-1 text-[#71717A] hover:bg-[#1F1F1F] hover:text-[#FAFAFA]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/employees/${row.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      {onEdit ? (
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      {row.deletedAt
                        ? onRestore && (
                            <DropdownMenuItem onSelect={() => onRestore(row)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )
                        : onDelete && (
                            <DropdownMenuItem
                              onSelect={() => onDelete(row)}
                              className="text-red-400 focus:text-red-300"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function formatSalary(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
