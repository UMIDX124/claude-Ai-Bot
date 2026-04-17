import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-[#1F1F1F] bg-[#0F0F0F] p-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] grid place-items-center">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-medium text-[#FAFAFA]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[#71717A]">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
