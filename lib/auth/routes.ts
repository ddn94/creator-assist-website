import { appHomePath, onboardingPath } from "@/lib/auth/access";

export function appHome(profile: {
  role: string;
  onboarding_completed_at: string | null;
}) {
  const role = profile.role === "agency" ? "agency" : "talent";
  if (!profile.onboarding_completed_at) return onboardingPath(role);
  return appHomePath(role);
}
