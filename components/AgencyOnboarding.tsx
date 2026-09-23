"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { saveAgencyOnboarding } from "@/lib/mockStore";

export function AgencyOnboarding() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

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
          onSubmit={(event) => {
            event.preventDefault();
            if (!agencyName.trim() || !name.trim() || !country) return;
            saveAgencyOnboarding({
              agencyName: agencyName.trim(),
              name: name.trim(),
              country,
            });
            router.push("/workspace");
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

          <Button
            type="submit"
            size="md"
            full
            iconRight="→"
            className="h-10"
            disabled={!country}
          >
            Finish setup
          </Button>
        </form>
      </Card>
    </div>
  );
}
