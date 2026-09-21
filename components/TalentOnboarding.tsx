"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { Field } from "@/components/Field";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import {
  platformCategoryFor,
  platformIdFor,
  saveSelfOnboarding,
  type MockCreatorPlatform,
} from "@/lib/mockStore";
import {
  AGE_BRACKETS,
  ONBOARDING_PLATFORMS,
  type AgeBracket,
} from "@/lib/onboarding";

type PlatformDraft = {
  enabled: boolean;
  handle: string;
  followers: string;
};

type TalentOnboardingProps = {
  initialName?: string;
  className?: string;
};

export function TalentOnboarding({
  initialName = "",
  className = "",
}: TalentOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialName);
  const [ageBracket, setAgeBracket] = useState("25_34");
  const [platforms, setPlatforms] = useState<Record<string, PlatformDraft>>(
    () =>
      Object.fromEntries(
        ONBOARDING_PLATFORMS.map((platform) => [
          platform,
          { enabled: true, handle: "", followers: "" },
        ]),
      ),
  );
  const [other, setOther] = useState({
    enabled: false,
    platform: "",
    handle: "",
    followers: "",
  });

  function updatePlatform(
    platform: string,
    patch: Partial<PlatformDraft>,
  ) {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...patch },
    }));
  }

  function collectPlatforms(): MockCreatorPlatform[] {
    const selected: MockCreatorPlatform[] = ONBOARDING_PLATFORMS.filter(
      (platform) => platforms[platform]?.enabled,
    ).map((platform) => {
      const row = platforms[platform];
      return {
        id: platformIdFor(platform),
        platform,
        followers: Number(row.followers) || 0,
        category: platformCategoryFor(platform),
        handle: row.handle.trim() || "",
      };
    });

    if (other.enabled && other.platform.trim()) {
      selected.push({
        id: `other-${Date.now()}`,
        platform: other.platform.trim(),
        followers: Number(other.followers) || 0,
        category: platformCategoryFor(other.platform.trim()),
        handle: other.handle.trim() || "",
      });
    }

    return selected;
  }

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
              if (!name.trim()) return;
              setStep(2);
            }}
          >
            <Field id="onboarding-name" label="Name">
              <TextField
                id="onboarding-name"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name or creator name"
                size="sm"
                full
              />
            </Field>

            <Field id="onboarding-age" label="Age bracket">
              <Select
                id="onboarding-age"
                name="ageBracket"
                value={ageBracket}
                onChange={setAgeBracket}
                options={[...AGE_BRACKETS]}
                size="sm"
                full
              />
            </Field>

            <Button type="submit" size="md" full iconRight="→" className="h-10">
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
            Tick the platforms you post on and add your community size on each.
          </Text>

          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              saveSelfOnboarding({
                name: name.trim(),
                ageBracket: ageBracket as AgeBracket,
                platforms: collectPlatforms(),
              });
              router.push("/home");
            }}
          >
            {ONBOARDING_PLATFORMS.map((platform) => {
              const row = platforms[platform];
              return (
                <div key={platform} className="space-y-2">
                  <div className="flex min-h-10 items-center">
                    <Checkbox
                      id={`use-${platform}`}
                      label={platform}
                      checked={row.enabled}
                      onChange={(event) =>
                        updatePlatform(platform, {
                          enabled: event.target.checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-1 md:gap-3">
                    <div className="min-w-0 flex-1 basis-32">
                      <TextField
                        name={`handle-${platform}`}
                        placeholder="@handle (optional)"
                        value={row.handle}
                        disabled={!row.enabled}
                        onChange={(event) =>
                          updatePlatform(platform, {
                            handle: event.target.value,
                          })
                        }
                        size="sm"
                        full
                      />
                    </div>
                    <div className="w-24 shrink-0 sm:w-28">
                      <TextField
                        name={`followers-${platform}`}
                        type="number"
                        min={0}
                        placeholder="Followers"
                        value={row.followers}
                        disabled={!row.enabled}
                        onChange={(event) =>
                          updatePlatform(platform, {
                            followers: event.target.value,
                          })
                        }
                        size="sm"
                        full
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <div className="flex min-h-10 items-center">
                <Checkbox
                  id="use-other"
                  label="Other"
                  checked={other.enabled}
                  onChange={(event) =>
                    setOther((prev) => ({
                      ...prev,
                      enabled: event.target.checked,
                    }))
                  }
                />
              </div>
              {other.enabled ? (
                <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-1 md:gap-3">
                  <div className="w-36 shrink-0 sm:w-40">
                    <TextField
                      name="platform-other"
                      placeholder="Platform name"
                      value={other.platform}
                      onChange={(event) =>
                        setOther((prev) => ({
                          ...prev,
                          platform: event.target.value,
                        }))
                      }
                      size="sm"
                      full
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-32">
                    <TextField
                      name="handle-other"
                      placeholder="@handle"
                      value={other.handle}
                      onChange={(event) =>
                        setOther((prev) => ({
                          ...prev,
                          handle: event.target.value,
                        }))
                      }
                      size="sm"
                      full
                    />
                  </div>
                  <div className="w-24 shrink-0 sm:w-28">
                    <TextField
                      name="followers-other"
                      type="number"
                      min={0}
                      placeholder="Followers"
                      value={other.followers}
                      onChange={(event) =>
                        setOther((prev) => ({
                          ...prev,
                          followers: event.target.value,
                        }))
                      }
                      size="sm"
                      full
                    />
                  </div>
                </div>
              ) : null}
            </div>

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
              >
                Finish setup
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
