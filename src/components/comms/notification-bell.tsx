"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NotificationKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
    if (!res.ok) return;
    const j = await res.json();
    setItems(j.items);
    setUnread(j.unreadCount);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function markOne(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    await load();
  }

  async function markAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1F1F1F]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-[#F59E0B] text-[#0D0D0D] text-[9px] font-bold grid place-items-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-[#1F1F1F] bg-[#111111] shadow-xl z-50 overflow-hidden">
          <header className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-2.5">
            <h3 className="text-sm font-medium text-[#FAFAFA]">
              Notifications{" "}
              {unread > 0 && (
                <span className="ml-1 text-[10px] text-[#F59E0B]">· {unread} new</span>
              )}
            </h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-[11px] text-[#F59E0B] hover:text-[#E5C158] inline-flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </header>
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-[#71717A]">
                You&apos;re all caught up.
              </li>
            )}
            {items.map((n) => {
              const inner = (
                <div
                  className={cn(
                    "px-4 py-3 border-b border-[#1F1F1F] hover:bg-[#161616] cursor-pointer",
                    !n.isRead && "bg-[#F59E0B]/5",
                  )}
                >
                  <header className="flex items-start gap-2">
                    <p className="flex-1 text-sm font-medium text-[#FAFAFA]">
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void markOne(n.id);
                        }}
                        className="text-[#71717A] hover:text-[#F59E0B]"
                        aria-label="Mark read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </header>
                  {n.body && (
                    <p className="mt-0.5 text-[11px] text-[#A1A1AA] line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-[#71717A]">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => void markOne(n.id)}>
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
          <footer className="border-t border-[#1F1F1F] p-2">
            <Button size="sm" variant="ghost" asChild className="w-full justify-center">
              <Link href="/dashboard/notifications">View all</Link>
            </Button>
          </footer>
        </div>
      )}
    </div>
  );
}
