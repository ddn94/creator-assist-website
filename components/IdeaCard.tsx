"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { CategoryCard } from "@/components/CategoryCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CategoryPill } from "@/components/CategoryPill";
import { IdeaEditModal } from "@/components/IdeaEditModal";
import { Text } from "@/components/Text";
import {
  IDEA_STATUS_LABELS,
  formatIdeaDate,
  ideaStatusCategory,
  type IdeaItem,
} from "@/lib/ideas";

type IdeaCardProps = {
  idea: IdeaItem;
  onUpdate: (idea: IdeaItem) => void;
  onDelete: (id: string) => void;
  onTurnIntoContent: (id: string) => void;
  turning?: boolean;
  tourAnchor?: boolean;
};

export function IdeaCard({
  idea,
  onUpdate,
  onDelete,
  onTurnIntoContent,
  turning = false,
  tourAnchor = false,
}: IdeaCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pending = idea.id.startsWith("pending-");
  const category = ideaStatusCategory(idea.status);
  const border = {
    idea: "border-idea-pill/25",
    in_progress: "border-organic-pill/25",
    used: "border-primary/25",
  }[idea.status];

  return (
    <>
      <CategoryCard
        category={category}
        className={`flex h-full flex-col border p-6 sm:p-8 ${border}`}
        tour={tourAnchor ? "tour-idea" : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <CategoryPill category={ideaStatusCategory(idea.status)}>
            {IDEA_STATUS_LABELS[idea.status]}
          </CategoryPill>
          <Text variant="caption" className="mt-1 shrink-0">
            {formatIdeaDate(idea.createdAt)}
          </Text>
        </div>

        <Text variant="cardTitle" className="mt-2.5 text-base">
          {idea.title}
        </Text>
        {idea.body ? (
          <Text
            variant="caption"
            className="mt-1 whitespace-pre-wrap text-sm text-ink"
          >
            {idea.body}
          </Text>
        ) : null}
        {idea.tags.length > 0 ? (
          <Text variant="caption" className="mt-1">
            {idea.tags.join(" · ")}
          </Text>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-3">
          {idea.linkedContentItemId ? (
            <Button
              href={`/overview/tracker/${idea.linkedContentItemId}`}
              variant="secondary"
              size="sm"
              className="h-10 border-0 bg-card"
            >
              View content item →
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-10"
              disabled={pending || turning}
              onClick={() => {
                if (turning) return;
                onTurnIntoContent(idea.id);
              }}
            >
              {turning ? "Turning into content…" : "Turn into content →"}
            </Button>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Delete"
              disabled={pending}
              onClick={() => setConfirming(true)}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrashIcon size={18} weight="regular" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Edit"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PencilSimpleIcon size={18} weight="regular" aria-hidden />
            </button>
          </div>
        </div>
      </CategoryCard>

      <ConfirmModal
        open={confirming}
        title="Delete this idea"
        question={`Are you sure you want to delete “${idea.title}”?`}
        confirmLabel="Delete"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onDelete(idea.id);
        }}
      />
      <IdeaEditModal
        idea={idea}
        open={editing}
        onClose={() => setEditing(false)}
        onSave={onUpdate}
      />
    </>
  );
}
