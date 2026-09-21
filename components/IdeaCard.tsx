"use client";

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { CategoryCard } from "@/components/CategoryCard";
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
};

export function IdeaCard({
  idea,
  onUpdate,
  onDelete,
  onTurnIntoContent,
}: IdeaCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <CategoryCard
        category="idea"
        className="flex h-full flex-col border border-idea-pill/25 p-6 sm:p-8"
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
              href={`/home/tracker/${idea.linkedContentItemId}`}
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
              onClick={() => onTurnIntoContent(idea.id)}
            >
              Turn into content →
            </Button>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Delete"
              onClick={() => onDelete(idea.id)}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-danger"
            >
              <TrashIcon size={18} weight="regular" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Edit"
              onClick={() => setEditing(true)}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-ink"
            >
              <PencilSimpleIcon size={18} weight="regular" aria-hidden />
            </button>
          </div>
        </div>
      </CategoryCard>

      <IdeaEditModal
        idea={idea}
        open={editing}
        onClose={() => setEditing(false)}
        onSave={onUpdate}
      />
    </>
  );
}
