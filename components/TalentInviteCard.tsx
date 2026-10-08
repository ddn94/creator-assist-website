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
import { formatShortDayMonth } from "@/lib/time";

function InviteButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type TalentInviteCardProps = {
  id: string;
  email: string | null;
  inviteCode: string | null;
  declinedAt?: string | null;
  status?: "record" | "invited" | "disconnected" | "requested";
};

export function TalentInviteCard({
  id,
  email,
  inviteCode,
  declinedAt = null,
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
          Connection request sent
        </Text>
        <Text variant="description" className="mt-1">
          {email ?? "This talent"} already has an account. They&apos;ll see
          your request on their Overview.
        </Text>
      </Card>
    );
  }

  const reconnect = status === "disconnected";

  if (inviteCode && !reconnect) {
    return (
      <Card className="p-4 sm:p-5">
        <Text variant="title" className="text-base">
          Invite code created
        </Text>
        <Text variant="heading" className="mt-1 font-mono tracking-wide">
          {inviteCode}
        </Text>
        <Text variant="description" className="mt-2">
          Send it to {email ?? "this talent"}. They create a talent account
          with this email and code.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <Text variant="title" className="text-base">
        {reconnect ? "Reconnect this talent" : "Invite this talent"}
      </Text>
      {declinedAt ? (
        <Text variant="description" className="mt-1">
          They declined on {formatShortDayMonth(declinedAt)}.
        </Text>
      ) : null}
      <Text variant="description" className="mt-1">
        {reconnect
          ? "They already have an account. Send a request. They answer it on Home, the first screen. You will see new content from the moment they accept, plus deals already on this card."
          : "Add their email. If they're already on Creator Assist, they'll get a connection request. If not, you'll get an invite code to send them."}
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
          label={reconnect ? "Send connection request" : "Invite"}
          pendingLabel={reconnect ? "Sending…" : "Inviting…"}
        />
      </form>
    </Card>
  );
}
