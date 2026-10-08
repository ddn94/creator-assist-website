"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { SignupTypeToggle } from "@/components/SignupTypeToggle";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { signUp } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" full iconRight="→" className="h-10" disabled={pending}>
      {pending ? "Creating…" : "Create agency account"}
    </Button>
  );
}

export default function AgencySignupPage() {
  const [state, action] = useActionState(signUp, EMPTY_AUTH_STATE);

  return (
    <AuthScreen
      title="Create your agency account"
      description="Manage your roster’s deals and invoicing in one place."
      aboveCard={<SignupTypeToggle active="agency" />}
      card={
        state.message ? (
          <FormAlert message={state.message} />
        ) : (
          <form className="space-y-2.5" action={action}>
            <input type="hidden" name="role" value="agency" />
            <div className="space-y-0.5">
              <Text as="label" variant="label" htmlFor="invite">
                Invite code
              </Text>
              <TextField
                id="invite"
                name="invite"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="From your invite email"
                required
                size="sm"
                full
              />
            </div>

            <div className="space-y-0.5">
              <Text as="label" variant="label" htmlFor="workEmail">
                Work email
              </Text>
              <TextField
                id="workEmail"
                name="workEmail"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                size="sm"
                full
              />
            </div>

            <div className="space-y-0.5">
              <Text as="label" variant="label" htmlFor="password">
                Password
              </Text>
              <TextField
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters"
                minLength={8}
                required
                size="sm"
                full
              />
            </div>

            <FormAlert error={state.error} />
            <CreateButton />
          </form>
        )
      }
      additional={
        <Text variant="description">
          Already have an account? <Button href="/login">Sign in</Button>
        </Text>
      }
    />
  );
}
