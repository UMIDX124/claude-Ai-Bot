import type { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  BACKLOG: {
    label: "Backlog",
    dot: "bg-[#71717A]",
    text: "text-[#A1A1AA]",
    bg: "bg-[#1F1F1F]",
  },
  TODO: {
    label: "To do",
    dot: "bg-[#3B82F6]",
    text: "text-[#60A5FA]",
    bg: "bg-[#3B82F6]/10",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
  IN_REVIEW: {
    label: "In review",
    dot: "bg-[#A855F7]",
    text: "text-[#C084FC]",
    bg: "bg-[#A855F7]/10",
  },
  BLOCKED: {
    label: "Blocked",
    dot: "bg-[#EF4444]",
    text: "text-[#F87171]",
    bg: "bg-[#EF4444]/10",
  },
  DONE: {
    label: "Done",
    dot: "bg-[#22C55E]",
    text: "text-[#4ADE80]",
    bg: "bg-[#22C55E]/10",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-[#52525B]",
    text: "text-[#71717A]",
    bg: "bg-[#1F1F1F]",
  },
};

export function TaskStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: TaskStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium border border-transparent",
        meta.bg,
        meta.text,
        size === "sm" ? "text-[11px]" : "text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
