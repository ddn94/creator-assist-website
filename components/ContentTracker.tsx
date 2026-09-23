"use client";

import { useMemo, useState } from "react";
import { AddContentPanel } from "@/components/AddContentPanel";
import { FilterPills } from "@/components/FilterPills";
import { Text } from "@/components/Text";
import { TrackerItemCard } from "@/components/TrackerItemCard";
import { addContent, setContentStage } from "@/lib/mockStore";
import { useTrackerItems } from "@/lib/useMockDb";
import {
  STAGES,
  STAGE_LABELS,
  nextStage,
  type ContentType,
  type Stage,
} from "@/lib/tracker";

export function ContentTracker({
  defaultAddOpen = false,
}: {
  defaultAddOpen?: boolean;
}) {
  const items = useTrackerItems();
  const [activeStage, setActiveStage] = useState<Stage>("concept");

  const counts = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<
      Stage,
      number
    >;
    for (const item of items) map[item.stage] += 1;
    return map;
  }, [items]);

  const activeItems = items.filter((item) => item.stage === activeStage);

  function advance(id: string) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    const stage = nextStage(item.stage);
    if (stage) setContentStage(id, stage);
  }

  function backToEdited(id: string) {
    setContentStage(id, "edited");
  }

  function addItem(payload: {
    title: string;
    platform: string;
    niche: string;
    type: string;
    brandName: string;
    goLiveDate: string;
    notes: string;
  }) {
    if (!payload.title) return;
    const type: ContentType =
      payload.type === "paid_collab" ? "paid_collab" : "organic";
    addContent({
      title: payload.title,
      platform: payload.platform || "Instagram",
      niche: payload.niche || null,
      type,
      brandName: type === "paid_collab" ? payload.brandName || null : null,
      goLiveDate: payload.goLiveDate || null,
      notes: payload.notes,
    });
    setActiveStage("concept");
  }

  return (
    <div>
      <AddContentPanel defaultOpen={defaultAddOpen} onAdd={addItem} />

      <div className="md:hidden">
        <FilterPills
          className="flex-nowrap overflow-x-auto pb-1"
          value={activeStage}
          onChange={(id) => setActiveStage(id as Stage)}
          items={STAGES.map((stage) => ({
            id: stage,
            label: STAGE_LABELS[stage],
            count: counts[stage] || undefined,
          }))}
        />
        <div className="mt-3 space-y-3">
          {activeItems.map((item) => (
            <TrackerItemCard
              key={item.id}
              item={item}
              onAdvance={advance}
              onBackToEdited={backToEdited}
            />
          ))}
          {activeItems.length === 0 ? (
            <Text variant="caption" className="py-10 text-center text-sm">
              Nothing in {STAGE_LABELS[activeStage]}.
            </Text>
          ) : null}
        </div>
      </div>

      <div className="hidden gap-3 overflow-x-auto pb-4 md:flex">
        {STAGES.map((stage) => {
          const colItems = items.filter((item) => item.stage === stage);
          return (
            <div
              key={stage}
              className="w-64 shrink-0 rounded-card bg-card/70"
            >
              <div className="flex items-center justify-between px-4 py-2.5">
                <Text variant="cardTitle">{STAGE_LABELS[stage]}</Text>
                <span className="rounded-full bg-card px-2 py-0.5 font-sans text-xs text-muted">
                  {colItems.length}
                </span>
              </div>
              <div className="min-h-24 space-y-2 p-2 pt-0">
                {colItems.map((item) => (
                  <TrackerItemCard
                    key={item.id}
                    item={item}
                    onAdvance={advance}
                    onBackToEdited={backToEdited}
                  />
                ))}
                {colItems.length === 0 ? (
                  <Text variant="caption" className="py-4 text-center">
                    Empty
                  </Text>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
