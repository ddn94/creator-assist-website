"use client";

import { Checkbox } from "@/components/Checkbox";
import { TextField } from "@/components/TextField";
import type { PlatformAnswer } from "@/lib/auth/profileAnswers";
import { PROFILE_PLATFORMS } from "@/lib/platforms";

export type PlatformRow = {
  key: string;
  platform: string;
  enabled: boolean;
  handle: string;
  followers: string;
};

export type OtherPlatform = {
  enabled: boolean;
  platform: string;
  handle: string;
  followers: string;
};

export const EMPTY_OTHER_PLATFORM: OtherPlatform = {
  enabled: false,
  platform: "",
  handle: "",
  followers: "",
};

export function buildPlatformRows(
  platforms: PlatformAnswer[],
  mode: "wizard" | "edit",
): PlatformRow[] {
  const preset = PROFILE_PLATFORMS.map((platform) => {
    const account = platforms.find((p) => p.platform === platform);
    return {
      key: platform,
      platform,
      enabled: mode === "wizard" ? true : !!account,
      handle: account?.handle ?? "",
      followers:
        account && account.followers > 0 ? String(account.followers) : "",
    };
  });

  const custom = platforms
    .filter(
      (p) => !(PROFILE_PLATFORMS as readonly string[]).includes(p.platform),
    )
    .map((p) => ({
      key: p.platform,
      platform: p.platform,
      enabled: true,
      handle: p.handle ?? "",
      followers: p.followers > 0 ? String(p.followers) : "",
    }));

  return [...preset, ...custom];
}

export function collectPlatformAnswers(
  rows: PlatformRow[],
  other: OtherPlatform,
): PlatformAnswer[] {
  const fromRows = rows
    .filter((row) => row.enabled)
    .map((row) => ({
      platform: row.platform,
      followers: Number(row.followers) || 0,
      handle: row.handle.trim() || "",
    }));

  if (other.enabled && other.platform.trim()) {
    fromRows.push({
      platform: other.platform.trim(),
      followers: Number(other.followers) || 0,
      handle: other.handle.trim() || "",
    });
  }

  return fromRows;
}

export function platformCommunitySummary(
  rows: PlatformRow[],
  other: OtherPlatform,
) {
  const enabled = rows.filter((row) => row.enabled);
  const otherCount = other.enabled && other.platform.trim() ? 1 : 0;
  const totalFollowers =
    enabled.reduce((sum, row) => sum + (Number(row.followers) || 0), 0) +
    (other.enabled ? Number(other.followers) || 0 : 0);
  return {
    totalFollowers,
    platformCount: enabled.length + otherCount,
  };
}

type TalentPlatformGridProps = {
  rows: PlatformRow[];
  other: OtherPlatform;
  onUpdateRow: (key: string, patch: Partial<PlatformRow>) => void;
  onOtherChange: (patch: Partial<OtherPlatform>) => void;
};

export function TalentPlatformGrid({
  rows,
  other,
  onUpdateRow,
  onOtherChange,
}: TalentPlatformGridProps) {
  return (
    <>
      {rows.map((row) => (
        <div key={row.key} className="space-y-2">
          <div className="flex min-h-10 items-center">
            <Checkbox
              id={`talent-use-${row.key}`}
              label={row.platform}
              checked={row.enabled}
              onChange={(event) =>
                onUpdateRow(row.key, { enabled: event.target.checked })
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
                  onUpdateRow(row.key, { handle: event.target.value })
                }
                size="sm"
                full
              />
            </div>
            <div className="w-24 shrink-0 sm:w-28 md:w-36">
              <TextField
                name={`followers-${row.key}`}
                type="number"
                min={0}
                placeholder="Followers"
                value={row.followers}
                disabled={!row.enabled}
                onChange={(event) =>
                  onUpdateRow(row.key, { followers: event.target.value })
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
            id="talent-use-other"
            label="Other"
            checked={other.enabled}
            onChange={(event) =>
              onOtherChange({ enabled: event.target.checked })
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
                  onOtherChange({ platform: event.target.value })
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
                  onOtherChange({ handle: event.target.value })
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
                  onOtherChange({ followers: event.target.value })
                }
                size="sm"
                full
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
