"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { saveProfileAnswers } from "@/lib/auth/actions";
import { COUNTRY_OPTIONS } from "@/lib/countries";

export function AgencyOnboarding({
  initialAgencyName = "",
  initialName = "",
  initialRosterSize = "",
}: {
  initialAgencyName?: string;
  initialName?: string;
  initialRosterSize?: string;
}) {
  const [agencyName, setAgencyName] = useState(initialAgencyName);
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
          Welcome to Creator Assist
        </Text>
        <Text variant="description" className="mt-2">
          A few details so the workspace fits your setup.
        </Text>
      </div>

      <Card className="p-5 sm:p-6">
        <Text variant="title" className="text-base sm:text-lg">
          About you
        </Text>
        <Text variant="description" className="mt-1">
          Who&apos;s running this workspace?
        </Text>

        <form
          className="mt-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!agencyName.trim() || !name.trim() || !country) return;
            setError(null);
            setPending(true);
            const result = await saveProfileAnswers(
              {
                agencyName: agencyName.trim(),
                name: name.trim(),
                country,
                ...(initialRosterSize ? { rosterSize: initialRosterSize } : {}),
              },
              true,
            );
            if (result?.error) {
              setError(result.error);
              setPending(false);
            }
          }}
        >
          <Field id="agency-onboarding-agency" label="Agency name">
            <TextField
              id="agency-onboarding-agency"
              name="agencyName"
              required
              value={agencyName}
              onChange={(event) => setAgencyName(event.target.value)}
              placeholder="Bright Talent"
              size="sm"
              full
            />
          </Field>

          <Field id="agency-onboarding-name" label="Name">
            <TextField
              id="agency-onboarding-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              size="sm"
              full
            />
          </Field>

          <Field id="agency-onboarding-country" label="Where are you based?">
            <Select
              id="agency-onboarding-country"
              name="country"
              value={country}
              onChange={setCountry}
              options={COUNTRY_OPTIONS}
              placeholder="Select a country"
              size="sm"
              full
            />
          </Field>

          <FormAlert error={error} />
          <Button
            type="submit"
            size="md"
            full
            iconRight="→"
            className="h-10"
            disabled={!country || pending}
          >
            {pending ? "Saving…" : "Finish setup"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
