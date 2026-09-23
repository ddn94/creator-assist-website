export function appHome(profile: {
  role: string;
  onboarding_completed_at: string | null;
}) {
  const agency = profile.role === "agency";
  if (!profile.onboarding_completed_at) {
    return agency ? "/onboarding/agency" : "/onboarding";
  }
  return agency ? "/workspace" : "/home";
}
