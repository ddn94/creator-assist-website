"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { addTalent } from "@/lib/auth/talentActions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

type AddTalentFormProps = {
  className?: string;
};

function SaveButton({
  status,
  children,
  variant = "primary",
}: {
  status: "invited" | "record";
  children: string;
  variant?: "primary" | "secondary";
}) {
  const { pending, data } = useFormStatus();
  const submitting = pending && data?.get("status") === status;
  return (
    <Button
      type="submit"
      name="status"
      value={status}
      size="sm"
      variant={variant}
      className="w-full sm:w-auto"
      disabled={pending}
    >
      {submitting ? "Saving…" : children}
    </Button>
  );
}

export function AddTalentForm({ className = "" }: AddTalentFormProps) {
  const [state, action] = useActionState(addTalent, EMPTY_AUTH_STATE);

  return (
    <form
      action={action}
      className={[
        "rounded-card border border-card-border bg-card p-4 shadow-card sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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

      <FormAlert error={state.error} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SaveButton status="invited">Save and send invite</SaveButton>
        <SaveButton status="record" variant="secondary">
          Save as a record
        </SaveButton>
        <Text variant="caption" className="sm:ml-1">
          You can invite a record later
        </Text>
      </div>
    </form>
  );
}
