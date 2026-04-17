import type { TaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; dot: string; text: string; rank: number }
> = {
  LOW: { label: "Low", dot: "bg-[#71717A]", text: "text-[#A1A1AA]", rank: 0 },
  MEDIUM: { label: "Medium", dot: "bg-[#3B82F6]", text: "text-[#60A5FA]", rank: 1 },
  HIGH: { label: "High", dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", rank: 2 },
  URGENT: { label: "Urgent", dot: "bg-[#EF4444]", text: "text-[#F87171]", rank: 3 },
};

export function TaskPriorityBadge({
  priority,
  variant = "dot",
  className,
}: {
  priority: TaskPriority;
  variant?: "dot" | "full";
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px]",
          meta.text,
          className,
        )}
        aria-label={`Priority ${meta.label}`}
        title={`Priority: ${meta.label}`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        meta.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
