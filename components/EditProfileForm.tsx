"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { Field } from "@/components/Field";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import {
  platformCategoryFor,
  platformIdFor,
  updateSelfPlatforms,
  updateSelfProfile,
  type MockCreatorPlatform,
} from "@/lib/mockStore";
import {
  AGE_BRACKETS,
  ONBOARDING_PLATFORMS,
  fmtFollowers,
  type AgeBracket,
} from "@/lib/onboarding";
import type { TalentProfileData } from "@/lib/profile";
import { useSelfProfile } from "@/lib/useMockDb";

type PlatformRow = {
  key: string;
  platform: string;
  preset: boolean;
  enabled: boolean;
  handle: string;
  followers: string;
};

type EditProfileFormProps = {
  className?: string;
};

function buildRows(profile: TalentProfileData): PlatformRow[] {
  const preset = ONBOARDING_PLATFORMS.map((platform) => {
    const account = profile.platforms.find((p) => p.platform === platform);
    return {
      key: platform,
      platform,
      preset: true,
      enabled: !!account,
      handle: account?.handle ?? "",
      followers:
        account && account.followers > 0 ? String(account.followers) : "",
    };
  });

  const custom = profile.platforms
    .filter(
      (p) =>
        !(ONBOARDING_PLATFORMS as readonly string[]).includes(p.platform),
    )
    .map((p) => ({
      key: p.id,
      platform: p.platform,
      preset: false,
      enabled: true,
      handle: p.handle ?? "",
      followers: p.followers > 0 ? String(p.followers) : "",
    }));

  return [...preset, ...custom];
}

export function EditProfileForm({ className = "" }: EditProfileFormProps) {
  const router = useRouter();
  const profile = useSelfProfile();
  const [name, setName] = useState(profile.name);
  const [ageBracket, setAgeBracket] = useState(profile.ageBracket);
  const [rows, setRows] = useState<PlatformRow[]>(() => buildRows(profile));
  const [other, setOther] = useState({
    enabled: false,
    platform: "",
    handle: "",
    followers: "",
  });

  const communitySummary = useMemo(() => {
    const enabled = rows.filter((row) => row.enabled);
    const otherCount =
      other.enabled && other.platform.trim() ? 1 : 0;
    const totalFollowers = enabled.reduce(
      (sum, row) => sum + (Number(row.followers) || 0),
      0,
    ) + (other.enabled ? Number(other.followers) || 0 : 0);
    const platformCount = enabled.length + otherCount;
    return { totalFollowers, platformCount };
  }, [rows, other]);

  function updateRow(key: string, patch: Partial<PlatformRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function goBack() {
    router.push("/home/profile");
  }

  function collectPlatforms(): MockCreatorPlatform[] {
    const fromRows = rows
      .filter((row) => row.enabled)
      .map((row) => ({
        id: row.preset ? platformIdFor(row.platform) : row.key,
        platform: row.platform,
        followers: Number(row.followers) || 0,
        category: platformCategoryFor(row.platform),
        handle: row.handle.trim() || "",
      }));

    if (other.enabled && other.platform.trim()) {
      fromRows.push({
        id: `other-${Date.now()}`,
        platform: other.platform.trim(),
        followers: Number(other.followers) || 0,
        category: platformCategoryFor(other.platform.trim()),
        handle: other.handle.trim() || "",
      });
    }

    return fromRows;
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

      <Card className="mb-6 p-5">
        <Text variant="title" className="mb-3 text-base">
          About you
        </Text>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            updateSelfProfile({
              name: name.trim(),
              ageBracket: ageBracket as AgeBracket,
            });
            goBack();
          }}
        >
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
          <Field id="edit-age" label="Age bracket">
            <Select
              id="edit-age"
              name="ageBracket"
              value={ageBracket}
              onChange={(value) =>
                setAgeBracket(value as typeof ageBracket)
              }
              options={[...AGE_BRACKETS]}
              size="sm"
              full
            />
          </Field>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <Text variant="title" className="mb-3 text-base">
          Platforms &amp; community size
        </Text>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateSelfPlatforms(collectPlatforms());
            goBack();
          }}
        >
          {rows.map((row) => (
            <div key={row.key} className="space-y-2">
              <div className="flex min-h-10 items-center">
                <Checkbox
                  id={`edit-use-${row.key}`}
                  label={row.platform}
                  checked={row.enabled}
                  onChange={(event) =>
                    updateRow(row.key, { enabled: event.target.checked })
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-1 md:gap-3">
                <div className="min-w-0 flex-1 basis-32">
                  <TextField
                    name={`handle-${row.key}`}
                    placeholder="@handle (optional)"
                    value={row.handle}
                    disabled={!row.enabled}
                    onChange={(event) =>
                      updateRow(row.key, { handle: event.target.value })
                    }
                    size="sm"
                    full
                  />
                </div>
                <div className="w-32 shrink-0 sm:w-36">
                  <TextField
                    name={`followers-${row.key}`}
                    type="number"
                    min={0}
                    placeholder="Followers"
                    value={row.followers}
                    disabled={!row.enabled}
                    onChange={(event) =>
                      updateRow(row.key, { followers: event.target.value })
                    }
                    size="sm"
                    full
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <div className="flex min-h-10 items-center">
              <Checkbox
                id="edit-use-other"
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

          <Button type="submit" size="sm" className="mt-1">
            Save platforms
          </Button>
        </form>
      </Card>
    </div>
  );
}
