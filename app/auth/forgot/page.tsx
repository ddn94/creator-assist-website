"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { requestPasswordReset } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" full iconRight="→" className="h-10" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, EMPTY_AUTH_STATE);

  return (
    <AuthScreen
      title="Reset your password"
      description={
        state.message
          ? "If an account exists for that email, a reset link is on its way."
          : "Enter your email and we’ll send a reset link."
      }
      density="comfortable"
      card={
        state.message ? (
          <FormAlert message={state.message} />
        ) : (
          <form className="space-y-3.5" action={action}>
            <div className="space-y-1">
              <Text as="label" variant="label" htmlFor="forgot-email">
                Email
              </Text>
              <TextField
                id="forgot-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                size="sm"
                full
              />
            </div>
            <FormAlert error={state.error} />
            <SendButton />
          </form>
        )
      }
      additional={
        <Text variant="description">
          Remembered it? <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
