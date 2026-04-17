import type { EmployeeStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  EmployeeStatus,
  { label: string; variant: "success" | "warning" | "danger" | "default"; dotClass: string }
> = {
  ACTIVE: { label: "Active", variant: "success", dotClass: "bg-emerald-500" },
  ON_LEAVE: { label: "On leave", variant: "warning", dotClass: "bg-yellow-500" },
  SUSPENDED: { label: "Suspended", variant: "warning", dotClass: "bg-orange-500" },
  TERMINATED: { label: "Terminated", variant: "danger", dotClass: "bg-red-500" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: EmployeeStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.ACTIVE;
  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}
