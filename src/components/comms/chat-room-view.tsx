"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";

type Message = {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  author: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function ChatRoomView({
  roomId,
  viewerId,
  roomName,
}: {
  roomId: string;
  viewerId: string;
  roomName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=200`, {
      cache: "no-store",
    });
    if (res.ok) setMessages(await res.json());
  }, [roomId]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, kind: "TEXT" }),
      });
      if (!res.ok) {
        alert("Send failed");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="border-b border-[#1F1F1F] px-4 py-3">
        <h2 className="text-sm font-medium text-[#FAFAFA]">{roomName}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-[#71717A] py-8">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.author.id === viewerId;
          return (
            <div
              key={m.id}
              className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
            >
              <EmployeeAvatar
                name={m.author.fullName ?? m.author.email}
                url={m.author.avatarUrl}
                size="sm"
              />
              <div className={`max-w-[70%] ${mine ? "text-right" : ""}`}>
                <header className="text-[10px] text-[#71717A] mb-0.5">
                  <span className="text-[#A1A1AA] font-medium">
                    {m.author.fullName ?? m.author.email}
                  </span>
                  <span
                    className="ml-2"
                    title={format(new Date(m.createdAt), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </span>
                </header>
                <div
                  className={`inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    mine
                      ? "bg-[#F59E0B] text-[#0D0D0D]"
                      : "bg-[#1F1F1F] text-[#FAFAFA]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-[#1F1F1F] p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message… (⌘+Enter to send)"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={send} disabled={busy || !draft.trim()}>
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
