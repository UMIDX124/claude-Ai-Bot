import type {
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import {
  Mail,
  Globe,
  MessageCircle,
  Phone,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS: Record<
  TicketStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  OPEN: { label: "Open", dot: "bg-[#3B82F6]", text: "text-[#60A5FA]", bg: "bg-[#3B82F6]/10" },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    dot: "bg-[#A855F7]",
    text: "text-[#C084FC]",
    bg: "bg-[#A855F7]/10",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
  WAITING_CUSTOMER: {
    label: "Waiting",
    dot: "bg-[#06B6D4]",
    text: "text-[#22D3EE]",
    bg: "bg-[#06B6D4]/10",
  },
  RESOLVED: {
    label: "Resolved",
    dot: "bg-[#22C55E]",
    text: "text-[#4ADE80]",
    bg: "bg-[#22C55E]/10",
  },
  CLOSED: {
    label: "Closed",
    dot: "bg-[#52525B]",
    text: "text-[#A1A1AA]",
    bg: "bg-[#1F1F1F]",
  },
};

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const m = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        m.bg,
        m.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

const PRIORITY: Record<
  TicketPriority,
  { label: string; dot: string; text: string; rank: number }
> = {
  LOW: { label: "Low", dot: "bg-[#71717A]", text: "text-[#A1A1AA]", rank: 0 },
  NORMAL: { label: "Normal", dot: "bg-[#3B82F6]", text: "text-[#60A5FA]", rank: 1 },
  HIGH: { label: "High", dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", rank: 2 },
  URGENT: { label: "Urgent", dot: "bg-[#EF4444]", text: "text-[#F87171]", rank: 3 },
  CRITICAL: {
    label: "Critical",
    dot: "bg-[#DC2626]",
    text: "text-[#FCA5A5]",
    rank: 4,
  },
};

export function TicketPriorityBadge({
  priority,
  variant = "full",
  className,
}: {
  priority: TicketPriority;
  variant?: "dot" | "full";
  className?: string;
}) {
  const m = PRIORITY[priority];
  if (variant === "dot") {
    return (
      <span
        className={cn("inline-flex items-center gap-1", m.text, className)}
        title={`Priority: ${m.label}`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        m.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

const CHANNEL_ICON: Record<TicketChannel, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  WEB: Globe,
  CHAT: MessageCircle,
  PHONE: Phone,
  INTERNAL: Lock,
};

export function TicketChannelIcon({
  channel,
  className,
}: {
  channel: TicketChannel;
  className?: string;
}) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[11px] text-[#A1A1AA]", className)}
      title={channel.toLowerCase()}
    >
      <Icon className="h-3 w-3" />
      {channel.toLowerCase()}
    </span>
  );
}
