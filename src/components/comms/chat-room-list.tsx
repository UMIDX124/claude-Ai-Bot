"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ChatRoomKind } from "@prisma/client";
import { cn } from "@/lib/utils";

type Room = {
  id: string;
  kind: ChatRoomKind;
  name: string | null;
  members: Array<{
    userId: string;
    user: { id: string; email: string; fullName: string | null; avatarUrl: string | null };
  }>;
  updatedAt: string;
  _count: { messages: number };
};

export function ChatRoomList({
  rooms,
  activeId,
  viewerId,
}: {
  rooms: Room[];
  activeId?: string;
  viewerId: string;
}) {
  return (
    <nav className="space-y-1">
      {rooms.length === 0 && (
        <p className="text-xs text-[#71717A] px-2 py-2">No chat rooms yet.</p>
      )}
      {rooms.map((r) => {
        const label =
          r.name ??
          (r.members
            .filter((m) => m.userId !== viewerId)
            .map((m) => m.user.fullName ?? m.user.email)
            .join(", ") ||
            "(empty)");
        return (
          <Link
            key={r.id}
            href={`/dashboard/chat/${r.id}`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm hover:bg-[#1F1F1F]",
              activeId === r.id && "bg-[#1F1F1F] border-l-2 border-[#F59E0B]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-medium text-[#FAFAFA]">{label}</span>
              <span className="text-[10px] text-[#71717A]">
                {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: false })}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
              {r.kind.toLowerCase()} · {r._count.messages} msgs
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
