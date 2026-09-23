"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { signIn } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" full iconRight="→" className="h-10" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function AuthForm({ notice }: { notice?: string | null }) {
  const [state, action] = useActionState(signIn, EMPTY_AUTH_STATE);

  return (
    <form className="space-y-3.5" action={action}>
      <FormAlert error={notice} />
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="email">
          Email
        </Text>
        <TextField
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          size="sm"
          full
        />
      </div>
      <div className="space-y-1">
        <Text as="label" variant="label" htmlFor="password">
          Password
        </Text>
        <TextField
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          size="sm"
          full
        />
      </div>
      <FormAlert error={state.error} />
      <SignInButton />
    </form>
  );
}
