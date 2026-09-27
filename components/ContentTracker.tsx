"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddContentPanel } from "@/components/AddContentPanel";
import { FilterPills } from "@/components/FilterPills";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TrackerItemCard } from "@/components/TrackerItemCard";
import {
  addContentAction,
  setContentStageAction,
} from "@/lib/data/actions";
import {
  STAGES,
  STAGE_LABELS,
  nextStage,
  type ContentType,
  type Stage,
  type TrackerItem,
} from "@/lib/tracker";
import { DEFAULT_PLATFORM } from "@/lib/platforms";

type ContentTrackerProps = {
  items: TrackerItem[];
  platformOptions: { value: string; label: string }[];
  defaultAddOpen?: boolean;
};

export function ContentTracker({
  items,
  platformOptions,
  defaultAddOpen = false,
}: ContentTrackerProps) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<Stage>("concept");
  const [saveError, setSaveError] = useState<string | null>(null);
  const serverKey = items.map((item) => `${item.id}:${item.stage}`).join("|");
  const [draft, setDraft] = useState<{
    key: string;
    rows: TrackerItem[];
  } | null>(null);
  const rows = draft?.key === serverKey ? draft.rows : items;

  const counts = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<
      Stage,
      number
    >;
    for (const item of rows) map[item.stage] += 1;
    return map;
  }, [rows]);

  const activeItems = rows.filter((item) => item.stage === activeStage);

  function showRows(next: TrackerItem[]) {
    setDraft({ key: serverKey, rows: next });
  }

  function moveStage(id: string, stage: Stage) {
    if (id.startsWith("pending-")) return;
    const item = rows.find((row) => row.id === id);
    if (!item || item.stage === stage) return;
    const previous = rows;
    setSaveError(null);
    showRows(rows.map((row) => (row.id === id ? { ...row, stage } : row)));
    void setContentStageAction(id, stage).then((result) => {
      if (result.error) {
        setDraft({ key: serverKey, rows: previous });
        setSaveError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function advance(id: string) {
    const item = rows.find((row) => row.id === id);
    if (!item) return;
    const stage = nextStage(item.stage);
    if (stage) moveStage(id, stage);
  }

  function backToEdited(id: string) {
    moveStage(id, "edited");
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
    const tempId = `pending-${crypto.randomUUID()}`;
    const optimistic: TrackerItem = {
      id: tempId,
      title: payload.title,
      platform: payload.platform || DEFAULT_PLATFORM,
      niche: payload.niche || null,
      type,
      brandName: type === "paid_collab" ? payload.brandName || null : null,
      stage: "concept",
      goLiveDate: payload.goLiveDate || null,
    };
    const previous = rows;
    setSaveError(null);
    showRows([optimistic, ...rows]);
    setActiveStage("concept");
    void addContentAction({
      title: optimistic.title,
      platform: optimistic.platform,
      niche: optimistic.niche,
      type,
      brandName: optimistic.brandName,
      goLiveDate: optimistic.goLiveDate,
      notes: payload.notes,
    }).then((result) => {
      if ("error" in result) {
        setDraft({ key: serverKey, rows: previous });
        setSaveError(result.error);
        return;
      }
      setDraft({
        key: serverKey,
        rows: [optimistic, ...previous].map((row) =>
          row.id === tempId ? { ...row, id: result.id } : row,
        ),
      });
      router.refresh();
    });
  }

  return (
    <div>
      <AddContentPanel
        defaultOpen={defaultAddOpen}
        platformOptions={platformOptions}
        onAdd={addItem}
      />
      {saveError ? (
        <div className="mb-4">
          <FormAlert error={saveError} />
        </div>
      ) : null}

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
          const colItems = rows.filter((item) => item.stage === stage);
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
