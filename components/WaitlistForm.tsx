"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { joinWaitlist } from "@/lib/auth/actions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function JoinButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full iconRight="→" disabled={pending}>
      {pending ? "Joining…" : "Join the waitlist"}
    </Button>
  );
}

export default function WaitlistForm() {
  const [state, action] = useActionState(joinWaitlist, EMPTY_AUTH_STATE);

  if (state.message) {
    return <FormAlert message={state.message} />;
  }

  return (
    <form className="space-y-3" action={action}>
      <TextField
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        size="md"
        full
      />
      <FormAlert error={state.error} />
      <JoinButton />
      <Text variant="caption" className="text-center">
        Early access + founding pricing. No spam.
      </Text>
    </form>
  );
}
