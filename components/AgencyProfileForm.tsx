"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { saveProfileAnswers } from "@/lib/auth/actions";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { ROSTER_OPTIONS } from "@/lib/profileFormOptions";

type ProfileMode = "wizard" | "edit";

type AgencyProfileFormProps = {
  mode: ProfileMode;
  initial: {
    agencyName: string;
    name: string;
    country?: string;
    rosterSize?: string;
  };
};

export function AgencyProfileForm({ mode, initial }: AgencyProfileFormProps) {
  const router = useRouter();
  const wizard = mode === "wizard";
  const [agencyName, setAgencyName] = useState(initial.agencyName);
  const [name, setName] = useState(initial.name);
  const [country, setCountry] = useState(initial.country ?? "");
  const [rosterSize, setRosterSize] = useState(initial.rosterSize || "1-10");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(complete: boolean) {
    if (!agencyName.trim() || !name.trim() || !country) return;
    setError(null);
    setPending(true);
    const result = await saveProfileAnswers(
      {
        agencyName: agencyName.trim(),
        name: name.trim(),
        country,
        rosterSize,
      },
      complete,
    );
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (!complete) {
      showToast("Profile saved.");
      router.push("/workspace/profile");
      router.refresh();
    }
  }

  const fields = (
    <>
      <Field id="agency-profile-agency" label="Agency name">
        <TextField
          id="agency-profile-agency"
          name="agencyName"
          required
          value={agencyName}
          onChange={(event) => setAgencyName(event.target.value)}
          placeholder="Agency name"
          size="sm"
          full
        />
      </Field>
      <Field id="agency-profile-name" label="Your name">
        <TextField
          id="agency-profile-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          size="sm"
          full
        />
      </Field>
      <Field id="agency-profile-country" label="Where are you based?">
        <Select
          id="agency-profile-country"
          name="country"
          value={country}
          onChange={setCountry}
          options={COUNTRY_OPTIONS}
          placeholder="Select a country"
          size="sm"
          full
        />
      </Field>
      <Field id="agency-profile-roster" label="Roster size">
        <Select
          id="agency-profile-roster"
          name="rosterSize"
          value={rosterSize}
          onChange={setRosterSize}
          options={[...ROSTER_OPTIONS]}
          size="sm"
          full
        />
      </Field>
    </>
  );

  if (wizard) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
            Welcome to Creator Assist
          </Text>
          <Text variant="description" className="mt-2">
            A few quick details to set up your workspace.
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
            onSubmit={(event) => {
              event.preventDefault();
              void save(true);
            }}
          >
            {fields}
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

  return (
    <div className="mx-auto w-full max-w-xl">
      <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
        Edit profile
      </Text>
      <Text variant="description" className="mt-1 mb-6">
        Your workspace details.
      </Text>
      <Card className="p-5">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save(false);
          }}
        >
          {fields}
          <FormAlert error={error} />
          <Button type="submit" size="sm" disabled={pending || !country}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
