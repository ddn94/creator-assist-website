"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { updatePassword } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" full iconRight="→" className="h-10" disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, EMPTY_AUTH_STATE);

  return (
    <form className="space-y-3.5" action={action}>
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="new-password">
          New password
        </Text>
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
      </div>
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="confirm-password">
          Repeat new password
        </Text>
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
      </div>
      <FormAlert error={state.error} />
      <SaveButton />
    </form>
  );
}
