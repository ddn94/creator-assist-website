"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { inviteTalent } from "@/lib/auth/talentActions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function InviteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Creating code…" : label}
    </Button>
  );
}

type TalentInviteCardProps = {
  id: string;
  email: string | null;
  inviteCode: string | null;
};

export function TalentInviteCard({ id, email, inviteCode }: TalentInviteCardProps) {
  const [state, action] = useActionState(inviteTalent, EMPTY_AUTH_STATE);

  if (inviteCode) {
    return (
      <Card className="p-4 sm:p-5">
        <Text variant="label">Invite code</Text>
        <Text variant="heading" className="mt-1 font-mono tracking-wide">
          {inviteCode}
        </Text>
        <Text variant="description" className="mt-2">
          Send this code to {email ?? "this talent"}. They create a talent account
          with this same email and code.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <Text variant="title" className="text-base">
        Invite this talent
      </Text>
      <Text variant="description" className="mt-1">
        A record stays private until you send a code. They sign up with that code
        and this email.
      </Text>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={id} />
        {email ? (
          <Text variant="description">Invite {email}</Text>
        ) : (
          <Field id="invite-email" label="Email">
            <TextField
              id="invite-email"
              name="email"
              type="email"
              required
              size="sm"
              full
              placeholder="name@email.com"
            />
          </Field>
        )}
        <FormAlert error={state.error} />
        <InviteButton label={email ? "Create invite code" : "Save email and create code"} />
      </form>
    </Card>
  );
}
