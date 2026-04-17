import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#71717A]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40 focus-visible:border-[#F59E0B]/60",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-colors",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
