"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { inviteTalent } from "@/lib/data/talentActions";
import { EMPTY_AUTH_STATE } from "@/lib/auth/types";

function InviteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : label}
    </Button>
  );
}

type TalentInviteCardProps = {
  id: string;
  email: string | null;
  inviteCode: string | null;
  status?: "record" | "invited" | "disconnected" | "requested";
};

export function TalentInviteCard({
  id,
  email,
  inviteCode,
  status = "record",
}: TalentInviteCardProps) {
  const router = useRouter();
  const [state, action] = useActionState(inviteTalent, EMPTY_AUTH_STATE);
  const toasted = useRef<string | null>(null);

  useEffect(() => {
    if (!state.message || toasted.current === state.message) return;
    toasted.current = state.message;
    showToast(state.message);
    router.refresh();
  }, [state.message, router]);

  if (status === "requested") {
    return (
      <Card className="p-4 sm:p-5">
        <Text variant="title" className="text-base">
          Request sent
        </Text>
        <Text variant="description" className="mt-1">
          {email ?? "This talent"} already has an account. They can accept the
          request from their profile. Until they do, you only see deals on this
          card.
        </Text>
      </Card>
    );
  }

  const reconnect = status === "disconnected";

  if (inviteCode && !reconnect) {
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
        {reconnect ? "Reconnect this talent" : "Invite this talent"}
      </Text>
      <Text variant="description" className="mt-1">
        {reconnect
          ? "They already have an account. Send a request. They accept it from their profile. You will see new content from the moment they accept, plus deals already on this card."
          : "A record stays private until you send a code. If this email already has an account, they get a request instead of a code."}
      </Text>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={id} />
        {email ? (
          <Text variant="description">
            {reconnect ? `Request ${email}` : `Invite ${email}`}
          </Text>
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
        <InviteButton
          label={
            reconnect
              ? "Send connection request"
              : email
                ? "Create invite code"
                : "Save email and create code"
          }
        />
      </form>
    </Card>
  );
}
