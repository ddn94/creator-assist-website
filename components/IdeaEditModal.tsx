"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/Button";
import { CategoryPill } from "@/components/CategoryPill";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import {
  IDEA_STATUS_LABELS,
  IDEA_STATUS_OPTIONS,
  ideaStatusCategory,
  parseTags,
  type IdeaItem,
  type IdeaStatus,
} from "@/lib/ideas";
import { categoryCard } from "@/lib/ui";

type IdeaEditModalProps = {
  idea: IdeaItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (idea: IdeaItem) => void;
};

export function IdeaEditModal({
  idea,
  open,
  onClose,
  onSave,
}: IdeaEditModalProps) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("idea");

  useEffect(() => {
    if (!idea || !open) return;
    setTitle(idea.title);
    setBody(idea.body);
    setTags(idea.tags.join(", "));
    setStatus(idea.status);
  }, [idea, open]);

  if (!idea) return null;

  function save() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onSave({
      ...idea!,
      title: nextTitle,
      body,
      tags: parseTags(tags),
      status,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit idea"
      description="Update the title, notes, tags, or status."
      footer={
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            size="sm"
            className="w-full sm:w-auto"
          >
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="space-y-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div
          className={[
            "flex items-center gap-2 rounded-xl px-3 py-2.5",
            categoryCard[ideaStatusCategory(status)],
          ].join(" ")}
        >
          <CategoryPill category={ideaStatusCategory(status)}>
            {IDEA_STATUS_LABELS[status]}
          </CategoryPill>
          <Text variant="caption" className="truncate text-ink">
            {title.trim() || idea.title}
          </Text>
        </div>

        <Field id={`${formId}-title`} label="Title">
          <TextField
            id={`${formId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            size="sm"
            full
          />
        </Field>
        <Field id={`${formId}-body`} label="Notes">
          <TextArea
            id={`${formId}-body`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            size="sm"
            full
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id={`${formId}-tags`} label="Tags">
            <TextField
              id={`${formId}-tags`}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="lifestyle, video"
              size="sm"
              full
            />
          </Field>
          <Field id={`${formId}-status`} label="Status">
            <Select
              id={`${formId}-status`}
              value={status}
              onChange={(value) => setStatus(value as IdeaStatus)}
              options={[...IDEA_STATUS_OPTIONS]}
              size="sm"
              full
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
