import type { Category } from "@/lib/ui";

/** Canonical platform catalog — onboarding, tracker pickers, and defaults. */
export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Other"] as const;

export type Platform = (typeof PLATFORMS)[number];

/** Named networks for profile/onboarding (freeform “Other” is a separate UI). */
export const PROFILE_PLATFORMS = PLATFORMS.filter(
  (platform) => platform !== "Other",
);

export const DEFAULT_PLATFORM: Platform = "Instagram";

export function contentPlatformOptions(
  platformNames: string[] = [],
  extra?: string | null,
): { value: string; label: string }[] {
  const custom = platformNames.filter(
    (platform) => !(PLATFORMS as readonly string[]).includes(platform),
  );
  const base = [...PLATFORMS, ...custom];
  const list = extra && !base.includes(extra) ? [...base, extra] : base;
  return list.map((platform) => ({ value: platform, label: platform }));
}

export function platformCategoryFor(platform: string): Category {
  if (platform === "TikTok") return "idea";
  if (platform === "YouTube") return "paid";
  return "organic";
}
