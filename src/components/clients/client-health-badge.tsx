import type { ClientHealth } from "@prisma/client";
import { cn } from "@/lib/utils";

const HEALTH: Record<
  ClientHealth,
  { label: string; color: string; text: string; bg: string }
> = {
  HEALTHY: {
    label: "Healthy",
    color: "bg-emerald-500",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  AT_RISK: {
    label: "At risk",
    color: "bg-yellow-500",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  CHURNING: {
    label: "Churning",
    color: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10",
  },
  UNKNOWN: {
    label: "Unknown",
    color: "bg-zinc-500",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
};

export function ClientHealthBadge({
  health,
  score,
  className,
}: {
  health: ClientHealth;
  score?: number | null;
  className?: string;
}) {
  const meta = HEALTH[health];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.bg,
        meta.text,
        className,
      )}
      title={score ? `${meta.label} · score ${score}` : meta.label}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.color)} />
      {meta.label}
      {typeof score === "number" ? (
        <span className="ml-1 text-[10px] opacity-70">{score}</span>
      ) : null}
    </span>
  );
}
