"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { saveProfileAnswers } from "@/lib/auth/actions";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { ROSTER_OPTIONS } from "@/lib/onboarding";

type AgencyEditFormProps = {
  agencyName: string;
  name: string;
  country: string;
  rosterSize: string;
};

export function AgencyEditForm({
  agencyName,
  name: initialName,
  country: initialCountry,
  rosterSize,
}: AgencyEditFormProps) {
  const router = useRouter();
  const [agency, setAgency] = useState(agencyName);
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState(initialCountry);
  const [roster, setRoster] = useState(rosterSize || "1-10");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
        Edit profile
      </Text>
      <Text variant="description" className="mt-1 mb-6">
        This is your workspace profile, separate from sign-in.
      </Text>
      <Card className="p-5">
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!agency.trim() || !name.trim() || !country) return;
            setPending(true);
            setError(null);
            const result = await saveProfileAnswers({
              agencyName: agency.trim(),
              name: name.trim(),
              country,
              rosterSize: roster,
            });
            if (result.error) {
              setError(result.error);
              setPending(false);
              return;
            }
            router.push("/workspace/profile");
            router.refresh();
          }}
        >
          <Field id="edit-agency" label="Agency name">
            <TextField
              id="edit-agency"
              name="agencyName"
              required
              value={agency}
              onChange={(event) => setAgency(event.target.value)}
              size="sm"
              full
            />
          </Field>
          <Field id="edit-name" label="Name">
            <TextField
              id="edit-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              size="sm"
              full
            />
          </Field>
          <Field id="edit-country" label="Where are you based?">
            <Select
              id="edit-country"
              name="country"
              value={country}
              onChange={setCountry}
              options={COUNTRY_OPTIONS}
              placeholder="Select a country"
              size="sm"
              full
            />
          </Field>
          <Field id="edit-roster" label="Roster size">
            <Select
              id="edit-roster"
              name="rosterSize"
              value={roster}
              onChange={setRoster}
              options={[...ROSTER_OPTIONS]}
              size="sm"
              full
            />
          </Field>
          <FormAlert error={error} />
          <Button type="submit" size="sm" disabled={pending || !country}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
