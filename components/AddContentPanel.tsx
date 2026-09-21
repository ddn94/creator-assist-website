"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import {
  CONTENT_TYPE_OPTIONS,
} from "@/lib/tracker";
import { useSelfContentPlatformOptions } from "@/lib/useMockDb";

type AddContentPanelProps = {
  defaultOpen?: boolean;
  onAdd?: (payload: {
    title: string;
    platform: string;
    niche: string;
    type: string;
    brandName: string;
    goLiveDate: string;
  }) => void;
};

export function AddContentPanel({
  defaultOpen = false,
  onAdd,
}: AddContentPanelProps) {
  const searchParams = useSearchParams();
  const openFromQuery = searchParams.get("add") === "1";
  const [open, setOpen] = useState(defaultOpen || openFromQuery);
  const platformOptions = useSelfContentPlatformOptions();
  const defaultPlatform = platformOptions[0]?.value ?? "Instagram";

  useEffect(() => {
    if (openFromQuery) setOpen(true);
  }, [openFromQuery]);

  return (
    <details
      className="group mb-5 overflow-hidden rounded-card border border-card-border bg-card shadow-card"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 font-display text-sm font-semibold text-ink select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
          <svg
            viewBox="0 0 16 16"
            className="size-3 fill-none stroke-current stroke-2 transition-transform group-open:rotate-45"
            aria-hidden
          >
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
        </span>
        Add content
      </summary>

      <form
        className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          onAdd?.({
            title: String(data.get("title") ?? "").trim(),
            platform: String(data.get("platform") ?? "") || defaultPlatform,
            niche: String(data.get("niche") ?? "").trim(),
            type: String(data.get("type") ?? "organic"),
            brandName: String(data.get("brandName") ?? "").trim(),
            goLiveDate: String(data.get("goLiveDate") ?? ""),
          });
          form.reset();
          setOpen(false);
        }}
      >
        <Field id="title" label="Title" className="md:col-span-2">
          <TextField
            id="title"
            name="title"
            required
            placeholder="e.g. Spring haul reel"
            size="sm"
            full
          />
        </Field>
        <Field id="platform" label="Platform">
          <Select
            id="platform"
            name="platform"
            defaultValue={defaultPlatform}
            options={platformOptions}
            size="sm"
            full
          />
        </Field>
        <Field id="niche" label="Niche / tag">
          <TextField
            id="niche"
            name="niche"
            placeholder="e.g. fashion"
            size="sm"
            full
          />
        </Field>
        <Field id="type" label="Type">
          <Select
            id="type"
            name="type"
            defaultValue="organic"
            options={[...CONTENT_TYPE_OPTIONS]}
            size="sm"
            full
          />
        </Field>
        <Field id="brandName" label="Brand (paid only)">
          <TextField
            id="brandName"
            name="brandName"
            placeholder="Brand name"
            size="sm"
            full
          />
        </Field>
        <Field id="goLiveDate" label="Go-live date">
          <TextField
            id="goLiveDate"
            name="goLiveDate"
            type="date"
            size="sm"
            full
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" size="sm" className="h-10 w-full md:w-auto">
            Add
          </Button>
        </div>
      </form>
    </details>
  );
}
