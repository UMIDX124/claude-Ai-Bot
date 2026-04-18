"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { AIRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  role: AIRole;
  content: string;
  createdAt: string;
};

type ChatApiResponse = { response: string };

export function AiConversationView({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  async function send() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true);
    const tempId = `tmp-${Date.now()}`;
    const userMsg: Msg = {
      id: tempId,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setDraft("");

    try {
      // Persist user message
      await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "USER", content }),
      });

      // Call Groq chat
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: withUser.map((m) => ({
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      if (!chatRes.ok) {
        alert(`AI request failed (${chatRes.status})`);
        return;
      }

      const { response } = (await chatRes.json()) as ChatApiResponse;

      // Persist assistant message
      const aiRes = await fetch(
        `/api/ai/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role: "ASSISTANT", content: response }),
        },
      );
      if (aiRes.ok) {
        const persisted = await aiRes.json();
        setMessages((prev) => [
          ...prev,
          {
            id: persisted.id,
            role: "ASSISTANT",
            content: response,
            createdAt: persisted.createdAt,
          },
        ]);
      } else {
        // fall back to local
        setMessages((prev) => [
          ...prev,
          {
            id: `tmp-reply-${Date.now()}`,
            role: "ASSISTANT",
            content: response,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-4">
        {messages.length === 0 && (
          <div className="text-center text-xs text-[#71717A] py-8">
            <Sparkles className="h-5 w-5 mx-auto text-[#F59E0B] mb-2" />
            Ask something about your CRM — clients, deals, tasks, or team.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "USER" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap",
                m.role === "USER"
                  ? "bg-[#F59E0B] text-[#0D0D0D]"
                  : "bg-[#1F1F1F] text-[#FAFAFA]",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-[#1F1F1F] px-4 py-2.5 text-sm text-[#71717A] inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 animate-pulse" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Alpha AI… (⌘+Enter to send)"
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
  );
}
