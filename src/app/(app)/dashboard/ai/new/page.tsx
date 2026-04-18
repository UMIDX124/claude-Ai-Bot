"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewAiConversationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title || null, model: "llama-3.3-70b-versatile" }),
      });
      if (res.ok) {
        const c = await res.json();
        router.push(`/dashboard/ai/${c.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/ai">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold text-[#FAFAFA]">New AI conversation</h1>
      <div className="space-y-1.5">
        <Label>Title (optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekly status summary…"
        />
      </div>
      <Button onClick={create} disabled={busy}>
        {busy ? "Creating…" : "Start conversation"}
      </Button>
    </div>
  );
}
