"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { DealCard } from "./deal-card";
import type { DealRow, StageRow } from "./types";

export function DealKanban({
  stages,
  deals,
  onOpen,
  onMove,
}: {
  stages: StageRow[];
  deals: DealRow[];
  onOpen?: (d: DealRow) => void;
  onMove: (args: {
    dealId: string;
    stageId: string;
    prevId: string | null;
    nextId: string | null;
    expectedUpdatedAt: string;
  }) => Promise<void> | void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const dealsByStage = useMemo(() => {
    const map = new Map<string, DealRow[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const d of deals) {
      const arr = map.get(d.stageId);
      if (arr) arr.push(d);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) => Number.parseFloat(a.position) - Number.parseFloat(b.position),
      );
    }
    return map;
  }, [deals, stages]);
  const active = activeId ? deals.find((d) => d.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeDeal = deals.find((d) => d.id === a.id);
    if (!activeDeal) return;

    let targetStageId: string;
    let overDealId: string | null = null;
    const overId = String(over.id);
    if (overId.startsWith("stage-")) {
      targetStageId = overId.slice("stage-".length);
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (!overDeal) return;
      targetStageId = overDeal.stageId;
      overDealId = overDeal.id;
    }

    const columnDeals = dealsByStage.get(targetStageId) ?? [];
    const filtered = columnDeals.filter((d) => d.id !== activeDeal.id);
    const overIndex = overDealId
      ? filtered.findIndex((d) => d.id === overDealId)
      : filtered.length;
    const prevId = overIndex > 0 ? filtered[overIndex - 1]?.id ?? null : null;
    const nextId =
      overIndex >= 0 && overIndex < filtered.length
        ? filtered[overIndex]?.id ?? null
        : null;

    if (
      activeDeal.stageId === targetStageId &&
      dealsByStage.get(targetStageId)?.[overIndex]?.id === activeDeal.id
    ) {
      return;
    }

    await onMove({
      dealId: activeDeal.id,
      stageId: targetStageId,
      prevId,
      nextId,
      expectedUpdatedAt: activeDeal.updatedAt,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = dealsByStage.get(stage.id) ?? [];
          const totalValue = items.reduce(
            (acc, d) => acc + Number.parseFloat(d.value),
            0,
          );
          const expectedValue = items.reduce(
            (acc, d) =>
              acc + (Number.parseFloat(d.value) * d.probability) / 100,
            0,
          );
          return (
            <DealColumn
              key={stage.id}
              stage={stage}
              count={items.length}
              totalValue={totalValue}
              expectedValue={expectedValue}
            >
              <SortableContext
                items={items.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((d) => (
                  <SortableDealCard key={d.id} deal={d} onOpen={onOpen} />
                ))}
                {items.length === 0 && (
                  <div className="h-16 rounded-md border border-dashed border-[#1F1F1F] grid place-items-center text-[11px] text-[#52525B]">
                    Drop here
                  </div>
                )}
              </SortableContext>
            </DealColumn>
          );
        })}
      </div>
      <DragOverlay>
        {active ? <DealCard deal={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DealColumn({
  stage,
  count,
  totalValue,
  expectedValue,
  children,
}: {
  stage: StageRow;
  count: number;
  totalValue: number;
  expectedValue: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] transition-colors",
        isOver && "border-[#F59E0B]/50 bg-[#F59E0B]/5",
      )}
    >
      <header className="px-3 py-2.5 border-b border-[#1F1F1F] space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: stage.color ?? "#F59E0B" }}
            />
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#A1A1AA]">
              {stage.name}
            </h3>
          </div>
          <span className="text-[10px] text-[#71717A] bg-[#1F1F1F] rounded-full px-1.5 py-0.5">
            {count}
          </span>
        </div>
        <p className="text-[10px] text-[#71717A]">
          <span className="text-[#A1A1AA]">${formatMoney(totalValue)}</span> total ·{" "}
          <span className="text-[#F59E0B]">${formatMoney(expectedValue)}</span> expected
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {children}
      </div>
    </section>
  );
}

function SortableDealCard({
  deal,
  onOpen,
}: {
  deal: DealRow;
  onOpen?: (d: DealRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <DealCard
      deal={deal}
      onOpen={onOpen}
      draggableProps={{
        ref: setNodeRef,
        style,
        ...attributes,
        ...listeners,
      }}
    />
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
