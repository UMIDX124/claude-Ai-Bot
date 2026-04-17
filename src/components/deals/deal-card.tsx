"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Flame, Clock, AlertTriangle } from "lucide-react";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { cn } from "@/lib/utils";
import type { DealRow } from "./types";

export function DealCard({
  deal,
  onOpen,
  draggableProps,
  selected = false,
}: {
  deal: DealRow;
  onOpen?: (d: DealRow) => void;
  draggableProps?: React.HTMLAttributes<HTMLElement> & {
    ref?: (el: HTMLElement | null) => void;
  };
  selected?: boolean;
}) {
  const owner =
    deal.ownerEmployee?.user.fullName ??
    `${deal.ownerEmployee?.user.firstName ?? ""} ${deal.ownerEmployee?.user.lastName ?? ""}`.trim() ??
    null;

  const daysInStage = Math.floor(
    (Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const stuck = daysInStage > 14 && deal.status === "OPEN";

  const content = (
    <article
      {...draggableProps}
      className={cn(
        "group rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 space-y-2 cursor-pointer",
        "hover:border-[#F59E0B]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150",
        selected && "border-[#F59E0B]/70 ring-1 ring-[#F59E0B]/30",
        deal.status === "WON" && "opacity-80",
        deal.status === "LOST" && "opacity-60",
        draggableProps?.className,
      )}
      onClick={(e) => {
        if (onOpen) onOpen(deal);
        draggableProps?.onClick?.(e);
      }}
    >
      <header className="flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-medium leading-snug text-[#FAFAFA] line-clamp-2">
          {deal.title}
        </h4>
        {stuck && (
          <AlertTriangle
            className="h-3.5 w-3.5 text-red-400 shrink-0"
            aria-label="Stuck in stage >14 days"
          />
        )}
      </header>

      {deal.client && (
        <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
          {deal.client.name}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-base font-mono font-semibold text-[#FAFAFA]">
          {formatCurrency(deal.currency, deal.value)}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#F59E0B]">
          <Flame className="h-3 w-3" />
          {deal.probability}%
        </span>
      </div>

      <footer className="flex items-center justify-between text-[11px] text-[#71717A]">
        <div className="flex items-center gap-2">
          {deal.ownerEmployee ? (
            <EmployeeAvatar
              name={owner}
              url={deal.ownerEmployee.user.avatarUrl}
              size="sm"
            />
          ) : (
            <span className="h-6 w-6 rounded-full border border-dashed border-[#1F1F1F] grid place-items-center text-[9px]">
              ?
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {deal.expectedClose && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {format(new Date(deal.expectedClose), "MMM d")}
            </span>
          )}
          <span title={`Last updated ${formatDistanceToNow(new Date(deal.updatedAt))} ago`}>
            {daysInStage}d
          </span>
        </div>
      </footer>
    </article>
  );

  if (!onOpen && !draggableProps) {
    return (
      <Link href={`/dashboard/deals/${deal.id}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function formatCurrency(currency: string, value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return `${currency} ${value}`;
  // Compact formatting for large values
  if (num >= 1_000_000) return `${currency} ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${currency} ${(num / 1_000).toFixed(0)}k`;
  return `${currency} ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
