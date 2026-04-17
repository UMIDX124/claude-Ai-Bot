"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StageRow } from "@/components/deals/types";

export function DealDetailClient({
  dealId,
  stages,
  currentStageId,
}: {
  dealId: string;
  stages: StageRow[];
  currentStageId: string;
}) {
  const router = useRouter();
  const [stageId, setStageId] = useState(currentStageId);
  const [busy, setBusy] = useState(false);

  async function move() {
    if (stageId === currentStageId) return;
    setBusy(true);
    const res = await fetch(`/api/deals/${dealId}/move`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    if (res.ok) router.refresh();
    else alert("Move failed");
    setBusy(false);
  }

  async function softDelete() {
    if (!confirm("Delete this deal?")) return;
    setBusy(true);
    const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/deals");
    } else alert("Delete failed");
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-4 flex items-center gap-3 flex-wrap">
      <span className="text-[11px] uppercase tracking-wider text-[#71717A]">
        Actions
      </span>
      <Select value={stageId} onValueChange={setStageId}>
        <SelectTrigger className="w-48 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={move} disabled={busy || stageId === currentStageId}>
        Move
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={softDelete}
        disabled={busy}
        className="bg-red-500/15 text-red-300 border-red-500/30 ml-auto"
      >
        Delete
      </Button>
    </div>
  );
}
