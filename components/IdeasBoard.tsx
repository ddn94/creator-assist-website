"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FilterPills } from "@/components/FilterPills";
import { IdeaCard } from "@/components/IdeaCard";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import {
  IDEA_STATUS_LABELS,
  IDEA_STATUS_OPTIONS,
  IDEA_STATUSES,
  parseTags,
  type IdeaStatus,
} from "@/lib/ideas";
import {
  addIdea,
  deleteIdea,
  turnIdeaIntoContent,
  upsertIdea,
} from "@/lib/mockStore";
import { useIdeas } from "@/lib/useMockDb";

export function IdeasBoard() {
  const router = useRouter();
  const ideas = useIdeas();
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (status !== "all" && idea.status !== status) return false;
      if (!needle) return true;
      return (
        idea.title.toLowerCase().includes(needle) ||
        idea.body.toLowerCase().includes(needle) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [ideas, status, query]);

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
    addIdea({
      title: payload.title,
      body: payload.body,
      tags: parseTags(payload.tags),
      status: nextStatus,
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
          className="w-full rounded-full sm:w-44"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onUpdate={(next) => upsertIdea(next)}
            onDelete={(id) => deleteIdea(id)}
            onTurnIntoContent={(id) => {
              const contentId = turnIdeaIntoContent(id);
              if (contentId) router.push(`/home/tracker/${contentId}`);
            }}
          />
        ))}
        {filtered.length === 0 ? (
          <Text
            variant="caption"
            className="col-span-full py-8 text-center text-sm"
          >
            No ideas match.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
