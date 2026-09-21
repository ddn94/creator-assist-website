"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { addAgencyTalent } from "@/lib/mockStore";

type AddTalentFormProps = {
  className?: string;
};

function parseFollowers(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function readForm(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    platform: String(data.get("platform") ?? "").trim(),
    handle: String(data.get("handle") ?? "").trim(),
    followers: parseFollowers(String(data.get("community") ?? "")),
    niche: String(data.get("niche") ?? "").trim(),
  };
}

export function AddTalentForm({ className = "" }: AddTalentFormProps) {
  const router = useRouter();

  function save(status: "invited" | "record", form: HTMLFormElement) {
    const values = readForm(form);
    if (!values.name) return;
    addAgencyTalent({
      name: values.name,
      email: values.email || null,
      status,
      platform: values.platform || undefined,
      handle: values.handle || null,
      followers: values.followers,
      niche: values.niche || null,
    });
    router.push("/workspace/talent");
  }

  return (
    <form
      className={[
        "rounded-card border border-card-border bg-card p-4 shadow-card sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onSubmit={(event) => {
        event.preventDefault();
        save("invited", event.currentTarget);
      }}
    >
      <div className="space-y-4">
        <Field id="name" label="Name">
          <TextField
            id="name"
            name="name"
            size="sm"
            full
            placeholder="Full name"
            required
          />
        </Field>

        <Field
          id="email"
          label="Email"
          hint="Leave blank to keep this as a record you track privately."
        >
          <TextField
            id="email"
            name="email"
            type="email"
            size="sm"
            full
            placeholder="Optional — needed only to send an invite"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="platform" label="Primary platform">
            <TextField
              id="platform"
              name="platform"
              size="sm"
              full
              placeholder="e.g. Instagram"
            />
          </Field>
          <Field id="handle" label="Handle">
            <TextField
              id="handle"
              name="handle"
              size="sm"
              full
              placeholder="@handle"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="community" label="Community size">
            <TextField
              id="community"
              name="community"
              size="sm"
              full
              placeholder="e.g. 25,000"
            />
          </Field>
          <Field id="niche" label="Niche">
            <TextField
              id="niche"
              name="niche"
              size="sm"
              full
              placeholder="e.g. Fashion"
            />
          </Field>
        </div>

        <Field id="notes" label="Notes">
          <TextArea
            id="notes"
            name="notes"
            size="sm"
            full
            rows={3}
            placeholder="Optional notes about this talent"
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="submit" size="sm" className="w-full sm:w-auto">
          Save and send invite
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            if (!form.reportValidity()) return;
            save("record", form);
          }}
        >
          Save as a record
        </Button>
        <Text variant="caption" className="sm:ml-1">
          You can invite a record later
        </Text>
      </div>
    </form>
  );
}
