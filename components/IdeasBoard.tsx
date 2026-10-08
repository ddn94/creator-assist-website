"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calendarDay } from "@/lib/calendarDay";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FilterPills } from "@/components/FilterPills";
import { showToast } from "@/components/Toast";
import { FormAlert } from "@/components/FormAlert";
import { IdeaCard } from "@/components/IdeaCard";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import {
  addIdeaAction,
  deleteIdeaAction,
  turnIdeaIntoContentAction,
  upsertIdeaAction,
} from "@/lib/data/actions";
import {
  IDEA_STATUS_LABELS,
  IDEA_STATUS_OPTIONS,
  IDEA_STATUSES,
  parseTags,
  type IdeaItem,
  type IdeaStatus,
} from "@/lib/ideas";

type IdeasBoardProps = {
  ideas: IdeaItem[];
};

export function IdeasBoard({ ideas }: IdeasBoardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [turningId, setTurningId] = useState<string | null>(null);
  const turningRef = useRef<string | null>(null);
  const serverKey = ideas
    .map(
      (idea) =>
        `${idea.id}:${idea.status}:${idea.title}:${idea.body}:${idea.tags.join(",")}:${idea.linkedContentItemId ?? ""}`,
    )
    .join("|");
  const [draft, setDraft] = useState<{
    key: string;
    rows: IdeaItem[];
  } | null>(null);
  const rows = draft?.key === serverKey ? draft.rows : ideas;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((idea) => {
      if (status !== "all" && idea.status !== status) return false;
      if (!needle) return true;
      return (
        idea.title.toLowerCase().includes(needle) ||
        idea.body.toLowerCase().includes(needle) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [rows, status, query]);

  function showRows(next: IdeaItem[]) {
    setDraft({ key: serverKey, rows: next });
  }

  const pills = [
    { id: "all", label: "All" },
    ...IDEA_STATUSES.map((value) => ({
      id: value,
      label: IDEA_STATUS_LABELS[value],
    })),
  ];

  function handleAdd(payload: {
    title: string;
    body: string;
    tags: string;
    status: string;
  }) {
    if (!payload.title) return;
    const nextStatus = IDEA_STATUSES.includes(payload.status as IdeaStatus)
      ? (payload.status as IdeaStatus)
      : "idea";
    const tempId = `pending-${crypto.randomUUID()}`;
    const optimistic: IdeaItem = {
      id: tempId,
      creatorId: rows[0]?.creatorId ?? "",
      title: payload.title,
      body: payload.body,
      tags: parseTags(payload.tags),
      status: nextStatus,
      createdAt: calendarDay(new Date()),
      linkedContentItemId: null,
    };
    const previous = rows;
    setSaveError(null);
    showRows([optimistic, ...rows]);
    void addIdeaAction({
      title: optimistic.title,
      body: optimistic.body,
      tags: optimistic.tags,
      status: nextStatus,
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
      showToast(`“${optimistic.title}” was added.`);
      router.refresh();
    });
  }

  return (
    <div>
      <Card className="mb-5">
        <Text variant="title" className="mb-3 text-base">
          New idea
        </Text>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            handleAdd({
              title: String(data.get("title") ?? "").trim(),
              body: String(data.get("body") ?? ""),
              tags: String(data.get("tags") ?? ""),
              status: String(data.get("status") ?? "idea"),
            });
            form.reset();
          }}
        >
          <TextField
            name="title"
            required
            placeholder="Idea title"
            size="sm"
            full
          />
          <TextArea
            name="body"
            rows={2}
            placeholder="Brain dump — hooks, angles, references…"
            size="sm"
            full
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <TextField
              name="tags"
              placeholder="Tags (comma-separated)"
              size="sm"
              full
            />
            <div className="flex gap-3">
              <Select
                name="status"
                defaultValue="idea"
                options={[...IDEA_STATUS_OPTIONS]}
                size="sm"
                full
              />
              <Button type="submit" size="xs" className="h-10 shrink-0 px-5">
                Add
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {saveError ? (
        <div className="mb-4">
          <FormAlert error={saveError} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          className="flex-nowrap overflow-x-auto"
          items={pills}
          value={status}
          onChange={setStatus}
        />
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ideas"
          size="sm"
          iconLeft={<MagnifyingGlassIcon size={16} weight="bold" />}
          className="w-full rounded-full sm:w-80"
        />
      </div>

      <div
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        data-tour="tour-idea-fallback"
      >
        {filtered.map((idea, index) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            tourAnchor={index === 0}
            turning={turningId === idea.id}
            onUpdate={(next) => {
              if (next.id.startsWith("pending-")) return;
              const previous = rows;
              setSaveError(null);
              showRows(rows.map((row) => (row.id === next.id ? next : row)));
              void upsertIdeaAction({
                id: next.id,
                title: next.title,
                body: next.body,
                tags: next.tags,
                status: next.status,
                linkedContentItemId: next.linkedContentItemId,
              }).then((result) => {
                if (result.error) {
                  setDraft({ key: serverKey, rows: previous });
                  setSaveError(result.error);
                  return;
                }
                showToast("Idea saved.");
                router.refresh();
              });
            }}
            onDelete={(id) => {
              if (id.startsWith("pending-")) return;
              const previous = rows;
              setSaveError(null);
              showRows(rows.filter((row) => row.id !== id));
              void deleteIdeaAction(id).then((result) => {
                if (result.error) {
                  setDraft({ key: serverKey, rows: previous });
                  setSaveError(result.error);
                  return;
                }
                showToast("Idea deleted.", "danger");
                router.refresh();
              });
            }}
            onTurnIntoContent={async (id) => {
              if (turningRef.current) return;
              turningRef.current = id;
              setTurningId(id);
              setSaveError(null);
              const idea = rows.find((row) => row.id === id);
              const result = await turnIdeaIntoContentAction(id);
              turningRef.current = null;
              setTurningId(null);
              if ("error" in result) {
                setSaveError(result.error);
                return;
              }
              showToast(
                `Content added from your idea “${idea?.title ?? "Idea"}”.`,
              );
              router.push(`/home/tracker/${result.id}`);
            }}
          />
        ))}
        {filtered.length === 0 ? (
          <Text
            variant="caption"
            className="col-span-full py-8 text-center text-sm"
          >
            No ideas here yet.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
