import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Input = {
  dueAt: string | null;
  metAt?: string | null;
  breachedAt?: string | null;
};

export function SlaTimerBadge({
  label,
  state,
  className,
}: {
  label: string;
  state: Input;
  className?: string;
}) {
  const now = Date.now();
  const dueMs = state.dueAt ? new Date(state.dueAt).getTime() : null;

  if (!dueMs) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-[#71717A]", className)}>
        <Clock className="h-3 w-3" /> {label}: no SLA
      </span>
    );
  }

  if (state.metAt && !state.breachedAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400",
          className,
        )}
        title={`${label} met at ${new Date(state.metAt).toLocaleString()}`}
      >
        <CheckCircle2 className="h-3 w-3" /> {label} met
      </span>
    );
  }

  if (state.breachedAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-red-500/15 text-red-400 font-medium",
          className,
        )}
        title={`${label} breached at ${new Date(state.breachedAt).toLocaleString()}`}
      >
        <AlertTriangle className="h-3 w-3" /> {label} breached
      </span>
    );
  }

  const remainingMs = dueMs - now;
  const totalSoonMs = 30 * 60_000; // warn threshold
  const isOverdue = remainingMs < 0;
  const isSoon = remainingMs < totalSoonMs;

  const abs = Math.abs(remainingMs);
  const hours = Math.floor(abs / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        isOverdue
          ? "bg-red-500/15 text-red-400"
          : isSoon
            ? "bg-yellow-500/15 text-yellow-400"
            : "bg-[#1F1F1F] text-[#A1A1AA]",
        className,
      )}
    >
      <Clock className="h-3 w-3" />
      {label}:{" "}
      {isOverdue ? `${display} late` : `${display} left`}
    </span>
  );
}
