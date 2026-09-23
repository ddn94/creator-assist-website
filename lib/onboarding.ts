export function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export const ONBOARDING_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
] as const;

export const AGE_BRACKETS = [
  { value: "under_18", label: "Under 18" },
  { value: "18_24", label: "18–24" },
  { value: "25_34", label: "25–34" },
  { value: "35_44", label: "35–44" },
  { value: "45_54", label: "45–54" },
  { value: "55_plus", label: "55+" },
] as const;

export type AgeBracket = (typeof AGE_BRACKETS)[number]["value"];

export const ROSTER_OPTIONS = [
  { value: "1-10", label: "1–10 talent" },
  { value: "11-25", label: "11–25 talent" },
  { value: "26-50", label: "26–50 talent" },
  { value: "50+", label: "50+ talent" },
] as const;
