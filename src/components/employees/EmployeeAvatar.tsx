import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function EmployeeAvatar({
  name,
  url,
  size = "md",
  className,
}: {
  name: string | null;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-base",
  } as const;
  const initials = (name ?? "??")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {url ? <AvatarImage src={url} alt={name ?? ""} /> : null}
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}
