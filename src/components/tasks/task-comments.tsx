"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";

export type TaskComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  authorId: string;
  author: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function TaskComments({
  taskId,
  comments,
  viewerId,
  onRefresh,
  canComment,
}: {
  taskId: string;
  comments: TaskComment[];
  viewerId: string;
  onRefresh: () => Promise<void> | void;
  canComment: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setDraft("");
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
    await onRefresh();
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-[#71717A]">No comments yet.</li>
        )}
        {comments.map((c) => {
          const name = c.author.fullName ?? c.author.email;
          const own = c.author.id === viewerId;
          return (
            <li key={c.id} className="flex gap-3">
              <EmployeeAvatar name={name} url={c.author.avatarUrl} size="sm" />
              <div className="flex-1 rounded-lg bg-[#0F0F0F] border border-[#1F1F1F] px-3 py-2 group">
                <header className="flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>
                    <span className="text-[#FAFAFA] font-medium">{name}</span>
                    <span className="ml-2">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                    {c.isEdited && <span className="ml-1">· edited</span>}
                  </span>
                  {own && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </header>
                <p className="mt-1 text-sm text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {canComment && (
        <div className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <footer className="flex items-center justify-between text-[11px] text-[#71717A]">
            <span>
              Tip: press <kbd className="px-1 rounded bg-[#1F1F1F]">⌘+Enter</kbd> to
              post
            </span>
            <Button size="sm" onClick={submit} disabled={busy || !draft.trim()}>
              <Send className="h-3 w-3 mr-1" />
              Post
            </Button>
          </footer>
        </div>
      )}
    </div>
  );
}
