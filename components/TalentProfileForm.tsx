"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { Select } from "@/components/Select";
import {
  buildPlatformRows,
  collectPlatformAnswers,
  EMPTY_OTHER_PLATFORM,
  platformCommunitySummary,
  TalentPlatformGrid,
  type OtherPlatform,
  type PlatformRow,
} from "@/components/TalentPlatformGrid";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { saveProfileAnswers } from "@/lib/auth/actions";
import type { PlatformAnswer } from "@/lib/auth/profileAnswers";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { AGE_BRACKETS, fmtFollowers } from "@/lib/profileFormOptions";

type ProfileMode = "wizard" | "edit";

type TalentProfileFormProps = {
  mode: ProfileMode;
  initial: {
    name: string;
    ageBracket?: string;
    country?: string;
    niche?: string;
    platforms?: PlatformAnswer[];
  };
  className?: string;
};

export function TalentProfileForm({
  mode,
  initial,
  className = "",
}: TalentProfileFormProps) {
  const router = useRouter();
  const wizard = mode === "wizard";
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initial.name);
  const [ageBracket, setAgeBracket] = useState(initial.ageBracket || "25_34");
  const [country, setCountry] = useState(initial.country ?? "");
  const [niche, setNiche] = useState(initial.niche ?? "");
  const [rows, setRows] = useState<PlatformRow[]>(() =>
    buildPlatformRows(initial.platforms ?? [], mode),
  );
  const [other, setOther] = useState<OtherPlatform>(EMPTY_OTHER_PLATFORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const communitySummary = useMemo(
    () => platformCommunitySummary(rows, other),
    [rows, other],
  );

  function updateRow(key: string, patch: Partial<PlatformRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function save(complete: boolean) {
    setError(null);
    setPending(true);
    const result = await saveProfileAnswers(
      {
        name: name.trim(),
        ageBracket,
        country,
        niche: niche.trim(),
        platforms: collectPlatformAnswers(rows, other),
      },
      complete,
    );
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (!complete) {
      router.push("/home/profile");
      router.refresh();
    }
  }

  const aboutFields = (
    <>
      <Field id="talent-profile-name" label="Name">
        <TextField
          id="talent-profile-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name or creator name"
          size="sm"
          full
        />
      </Field>
      <Field id="talent-profile-age" label="Age bracket">
        <Select
          id="talent-profile-age"
          name="ageBracket"
          value={ageBracket}
          onChange={setAgeBracket}
          options={[...AGE_BRACKETS]}
          size="sm"
          full
        />
      </Field>
      <Field id="talent-profile-country" label="Where are you based?">
        <Select
          id="talent-profile-country"
          name="country"
          value={country}
          onChange={setCountry}
          options={COUNTRY_OPTIONS}
          placeholder="Select a country"
          size="sm"
          full
        />
      </Field>
      <Field id="talent-profile-niche" label="Niche">
        <TextField
          id="talent-profile-niche"
          name="niche"
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          placeholder="e.g. Lifestyle, Beauty, Fitness"
          size="sm"
          full
        />
      </Field>
    </>
  );

  const platformGrid = (
    <TalentPlatformGrid
      rows={rows}
      other={other}
      onUpdateRow={updateRow}
      onOtherChange={(patch) => setOther((prev) => ({ ...prev, ...patch }))}
    />
  );

  if (wizard) {
    return (
      <div
        className={["mx-auto w-full max-w-xl px-4 py-8 sm:px-6", className]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="mb-8 text-center">
          <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
            Welcome to Creator Assist
          </Text>
          <Text variant="description" className="mt-2">
            A couple of quick questions so the app fits your setup.
          </Text>
          <OnboardingProgress step={step} className="mt-4" />
        </div>

        {step === 1 ? (
          <Card className="p-5 sm:p-6">
            <Text variant="title" className="text-base sm:text-lg">
              Step 1 of 2 — About you
            </Text>
            <Text variant="description" className="mt-1">
              Who&apos;s creating?
            </Text>
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim() || !country) return;
                setStep(2);
              }}
            >
              {aboutFields}
              <Button
                type="submit"
                size="md"
                full
                iconRight="→"
                className="h-10"
                disabled={!country}
              >
                Continue
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <Text variant="title" className="text-base sm:text-lg">
              Step 2 of 2 — Your platforms
            </Text>
            <Text variant="description" className="mt-1">
              Tick the platforms you post on and add your community size on
              each.
            </Text>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void save(true);
              }}
            >
              {platformGrid}
              <FormAlert error={error} />
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="h-10 sm:flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="md"
                  className="h-10 sm:flex-1"
                  iconRight="→"
                  disabled={pending}
                >
                  {pending ? "Saving…" : "Finish setup"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div
      className={["mx-auto w-full max-w-xl", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
        Edit profile
      </Text>
      <Text variant="description" className="mt-1 mb-6">
        Total community:{" "}
        <Text as="span" variant="description" className="font-semibold text-ink">
          {fmtFollowers(communitySummary.totalFollowers)}
        </Text>{" "}
        across {communitySummary.platformCount} platform
        {communitySummary.platformCount === 1 ? "" : "s"}
      </Text>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !country) return;
          void save(false);
        }}
      >
        <Card className="p-5">
          <Text variant="title" className="mb-3 text-base">
            About you
          </Text>
          <div className="space-y-3">{aboutFields}</div>
        </Card>

        <Card className="p-5">
          <Text variant="title" className="mb-3 text-base">
            Platforms &amp; community size
          </Text>
          <div className="space-y-3">{platformGrid}</div>
        </Card>

        <FormAlert error={error} />
        <Button type="submit" size="sm" disabled={pending || !country}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
