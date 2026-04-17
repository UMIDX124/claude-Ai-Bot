"use client";

import { Trash2, UserCheck, UserX, X } from "lucide-react";
import type { EmployeeStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BulkActionsBar({
  count,
  onClear,
  onBulkStatus,
  onBulkDelete,
  canDelete,
}: {
  count: number;
  onClear: () => void;
  onBulkStatus: (status: EmployeeStatus) => void;
  onBulkDelete: () => void;
  canDelete: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-4 mx-auto w-fit rounded-full border border-[#F59E0B]/40 bg-[#111111]/95 backdrop-blur px-4 py-2.5 shadow-xl flex items-center gap-3 z-10">
      <span className="text-sm font-medium text-[#F59E0B]">
        {count} selected
      </span>
      <span className="h-4 w-px bg-[#1F1F1F]" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <UserCheck className="h-4 w-4 mr-1.5" />
            Change status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Set status for {count}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["ACTIVE", "ON_LEAVE", "SUSPENDED"] as EmployeeStatus[]).map((s) => (
            <DropdownMenuItem key={s} onSelect={() => onBulkStatus(s)}>
              {s.replace(/_/g, " ").toLowerCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete ? (
        <Button
          variant="danger"
          size="sm"
          onClick={onBulkDelete}
          className="bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      ) : (
        <Button variant="ghost" size="sm" disabled>
          <UserX className="h-4 w-4 mr-1.5" />
          Delete (no perm)
        </Button>
      )}
      <button
        type="button"
        className="rounded-full p-1 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1F1F1F]"
        onClick={onClear}
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
