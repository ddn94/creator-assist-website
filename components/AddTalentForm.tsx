"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { addTalent } from "@/lib/data/talentActions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

type AddTalentFormProps = {
  className?: string;
};

function SaveButton({
  status,
  children,
  variant = "primary",
  action,
}: {
  status: "invited" | "record";
  children: string;
  variant?: "primary" | "secondary";
  action: (formData: FormData) => void;
}) {
  const { pending, data } = useFormStatus();
  const submitting = pending && data?.get("status") === status;
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      className="w-full sm:w-auto"
      disabled={pending}
      formAction={(formData) => {
        formData.set("status", status);
        action(formData);
      }}
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
          hint="Only needed to invite them. Until then, only you see this."
        >
          <TextField
            id="email"
            name="email"
            type="email"
            size="sm"
            full
            placeholder="Optional — needed only to invite them"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="platform" label="Primary platform">
            <TextField
              id="platform"
              name="platform"
              size="sm"
              full
              placeholder="Platform"
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

      {state.error ? (
        <div className="mt-4">
          <FormAlert error={state.error} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SaveButton status="invited" action={action}>
            Invite
          </SaveButton>
          <SaveButton status="record" variant="secondary" action={action}>
            Save without inviting
          </SaveButton>
        <Text variant="caption" className="sm:ml-1">
          You can invite them later
        </Text>
      </div>
    </form>
  );
}
