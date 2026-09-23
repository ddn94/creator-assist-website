import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appHome } from "@/lib/auth/routes";
import { hasSupabaseEnv, supabaseEnv } from "@/lib/supabase/env";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function isAppPath(path: string) {
  return (
    path.startsWith("/home") ||
    path.startsWith("/workspace") ||
    path.startsWith("/onboarding")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pending: PendingCookie[] = [];

  if (!hasSupabaseEnv()) return supabaseResponse;

  const { url, publishableKey } = supabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pending.splice(0, pending.length, ...cookiesToSet);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (path.startsWith("/auth/callback") || path.startsWith("/auth/reset")) {
    return supabaseResponse;
  }

  function redirectTo(pathname: string, search = "") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname;
    redirectUrl.search = search;
    const redirected = NextResponse.redirect(redirectUrl);
    pending.forEach(({ name, value, options }) => {
      redirected.cookies.set(name, value, options);
    });
    return redirected;
  }

  if (!user) {
    if (isAppPath(path)) return redirectTo("/login");
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    if (isAppPath(path)) return redirectTo("/login", "?error=profile");
    return supabaseResponse;
  }

  const home = appHome(profile);
  const onboardingPath = profile.role === "agency" ? "/onboarding/agency" : "/onboarding";
  const ownPrefix = profile.role === "agency" ? "/workspace" : "/home";
  const signingIn =
    path === "/" || path === "/login" || path.startsWith("/signup");

  if (!profile.onboarding_completed_at) {
    if (signingIn || (isAppPath(path) && path !== onboardingPath)) {
      return redirectTo(onboardingPath);
    }
    return supabaseResponse;
  }

  const wrongApp =
    (path.startsWith("/home") && ownPrefix !== "/home") ||
    (path.startsWith("/workspace") && ownPrefix !== "/workspace") ||
    path === "/onboarding" ||
    path.startsWith("/onboarding/");

  if (signingIn || wrongApp) return redirectTo(home);
  return supabaseResponse;
}
