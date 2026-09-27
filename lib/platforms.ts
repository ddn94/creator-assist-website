import type { Category } from "@/lib/ui";

/** Canonical platform catalog — onboarding, tracker pickers, and defaults. */
export const PLATFORMS = ["Instagram", "TikTok", "YouTube"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const DEFAULT_PLATFORM: Platform = "Instagram";

export function contentPlatformOptions(
  platformNames: string[],
  extra?: string | null,
): { value: string; label: string }[] {
  const base = platformNames.length > 0 ? platformNames : [...PLATFORMS];
  const list = extra && !base.includes(extra) ? [...base, extra] : base;
  return list.map((platform) => ({ value: platform, label: platform }));
}

export function platformCategoryFor(platform: string): Category {
  if (platform === "TikTok") return "idea";
  if (platform === "YouTube") return "paid";
  return "organic";
}
