"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  authorId: string;
  author: { id: string; email: string; fullName: string | null; avatarUrl: string | null };
};

export function ClientDetailClient({
  clientId,
  initialNotes,
  viewerId,
  canEdit,
}: {
  clientId: string;
  initialNotes: Note[];
  viewerId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/notes`, { cache: "no-store" });
    if (res.ok) setNotes(await res.json());
    router.refresh();
  }, [clientId, router]);

  async function submit() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, isPinned: false }),
      });
      setDraft("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/clients/${clientId}/notes/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {notes.length === 0 && (
          <li className="text-sm text-[#71717A]">No notes yet.</li>
        )}
        {notes.map((n) => {
          const own = n.author.id === viewerId;
          return (
            <li
              key={n.id}
              className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 group"
            >
              <header className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>
                  {n.isPinned && (
                    <Pin className="inline h-3 w-3 mr-1 text-[#F59E0B]" />
                  )}
                  <span className="text-[#FAFAFA] font-medium">
                    {n.author.fullName ?? n.author.email}
                  </span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </span>
                {own && (
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-red-400"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </header>
              <p className="mt-1 text-sm text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                {n.content}
              </p>
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <div className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an internal note…"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <footer className="flex items-center justify-end">
            <Button size="sm" onClick={submit} disabled={busy || !draft.trim()}>
              <Send className="h-3 w-3 mr-1" />
              Save
            </Button>
          </footer>
        </div>
      )}
    </div>
  );
}
