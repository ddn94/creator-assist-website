import type { UserRole } from "@/lib/auth/types";

/** Minimal facts both the proxy gate and page loaders use. */
export type AccessSubject = {
  role: UserRole;
  onboarded: boolean;
};

export function appHomePath(role: UserRole): string {
  return role === "agency" ? "/workspace" : "/overview";
}

export function onboardingPath(role: UserRole): string {
  return role === "agency" ? "/onboarding/agency" : "/onboarding";
}

export function isAppPath(path: string): boolean {
  return (
    path.startsWith("/overview") ||
    path.startsWith("/workspace") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/admin")
  );
}

function isSigningInPath(path: string): boolean {
  return path === "/" || path === "/login" || path.startsWith("/signup");
}

/**
 * Shared “can you enter?” checklist.
 * Returns a redirect path, or null when the request is allowed.
 */
export function accessRedirect(
  subject: AccessSubject | null,
  intent:
    | { kind: "app"; role: UserRole }
    | { kind: "onboarding"; role: UserRole }
    | { kind: "admin"; isAdmin: boolean }
    | { kind: "path"; path: string },
): string | null {
  if (!subject) return "/login";

  const home = appHomePath(subject.role);
  const onboarding = onboardingPath(subject.role);

  if (intent.kind === "app") {
    if (subject.role !== intent.role) return home;
    if (!subject.onboarded) return onboarding;
    return null;
  }

  if (intent.kind === "onboarding") {
    if (subject.role !== intent.role) return onboarding;
    if (subject.onboarded) return home;
    return null;
  }

  if (intent.kind === "admin") {
    if (!intent.isAdmin) return home;
    if (!subject.onboarded) return onboarding;
    return null;
  }

  // Proxy path routing — same rules as the signed gate cookie.
  const { path } = intent;
  if (!subject.onboarded) {
    if (isSigningInPath(path) || (isAppPath(path) && path !== onboarding)) {
      return onboarding;
    }
    return null;
  }

  const ownPrefix = appHomePath(subject.role);
  const wrongApp =
    (path.startsWith("/overview") && ownPrefix !== "/overview") ||
    (path.startsWith("/workspace") && ownPrefix !== "/workspace") ||
    path === "/onboarding" ||
    path.startsWith("/onboarding/");

  if (isSigningInPath(path) || wrongApp) return home;
  return null;
}

export function subjectFromProfile(profile: {
  role: UserRole;
  onboarding_completed_at: string | null;
}): AccessSubject {
  return {
    role: profile.role,
    onboarded: Boolean(profile.onboarding_completed_at),
  };
}
