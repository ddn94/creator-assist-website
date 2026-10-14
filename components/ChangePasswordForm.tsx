"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { changePassword } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save password"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, EMPTY_AUTH_STATE);

  return (
    <Card className="p-4 sm:p-6">
      <Text variant="title" className="text-base">
        Change password
      </Text>
      <Text variant="description" className="mt-1">
        Use the password you sign in with now, then choose a new one.
      </Text>
      <form action={action} className="mt-4 space-y-4">
        <Field id="current-password" label="Current password">
          <TextField
            id="current-password"
            name="current"
            type="password"
            required
            autoComplete="current-password"
            size="sm"
            full
          />
        </Field>
        <Field id="new-password" label="New password">
          <TextField
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8+ characters"
            size="sm"
            full
          />
        </Field>
        <Field id="confirm-password" label="Repeat new password">
          <TextField
            id="confirm-password"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Same again"
            size="sm"
            full
          />
        </Field>
        <FormAlert error={state.error} />
        <SaveButton />
      </form>
    </Card>
  );
}
