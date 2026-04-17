import type { ClientStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS: Record<
  ClientStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  ACTIVE: {
    label: "Active",
    dot: "bg-[#22C55E]",
    text: "text-[#4ADE80]",
    bg: "bg-[#22C55E]/10",
  },
  PROSPECT: {
    label: "Prospect",
    dot: "bg-[#3B82F6]",
    text: "text-[#60A5FA]",
    bg: "bg-[#3B82F6]/10",
  },
  PAUSED: {
    label: "Paused",
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
  CHURNED: {
    label: "Churned",
    dot: "bg-[#EF4444]",
    text: "text-[#F87171]",
    bg: "bg-[#EF4444]/10",
  },
};

export function ClientStatusBadge({
  status,
  className,
}: {
  status: ClientStatus;
  className?: string;
}) {
  const meta = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.bg,
        meta.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
