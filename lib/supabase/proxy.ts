import { createServerClient } from "@supabase/ssr";
import { after, NextResponse, type NextRequest } from "next/server";
import {
  accessRedirect,
  isAppPath,
  type AccessSubject,
} from "@/lib/auth/access";
import {
  decodeGate,
  encodeGate,
  GATE_COOKIE,
  gateCookieOptions,
  type Gate,
} from "@/lib/auth/gate";
import { hasSupabaseEnv, supabaseEnv } from "@/lib/supabase/env";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pending: PendingCookie[] = [];
  let gateWrite: "keep" | "clear" | Gate = "keep";

  function applyGate(response: NextResponse) {
    if (gateWrite === "keep") return response;
    if (gateWrite === "clear") {
      response.cookies.set(GATE_COOKIE, "", { ...gateCookieOptions, maxAge: 0 });
      return response;
    }
    const signed = encodeGate(gateWrite);
    if (!signed) {
      if (request.cookies.get(GATE_COOKIE)) {
        response.cookies.set(GATE_COOKIE, "", { ...gateCookieOptions, maxAge: 0 });
      }
      return response;
    }
    response.cookies.set(GATE_COOKIE, signed, gateCookieOptions);
    return response;
  }

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

  // Verifies the login pass locally (JWKS). Falls back to the auth server
  // only when the project still signs tokens with the legacy shared secret.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : "";

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
    return applyGate(redirected);
  }

  if (!userId) {
    if (request.cookies.get(GATE_COOKIE)) gateWrite = "clear";
    if (isAppPath(path)) return redirectTo("/login");
    return applyGate(supabaseResponse);
  }

  let gate = decodeGate(request.cookies.get(GATE_COOKIE)?.value);
  if (!gate || gate.sub !== userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      if (request.cookies.get(GATE_COOKIE)) gateWrite = "clear";
      if (isAppPath(path)) return redirectTo("/login", "?error=profile");
      return applyGate(supabaseResponse);
    }

    gate = {
      sub: userId,
      role: profile.role === "agency" ? "agency" : "talent",
      onboarded: Boolean(profile.onboarding_completed_at),
      exp: 0,
    };
    gateWrite = gate;
  }

  const subject: AccessSubject = {
    role: gate.role,
    onboarded: gate.onboarded,
  };
  const to = accessRedirect(subject, { kind: "path", path });
  if (to) return redirectTo(to);

  // Presence for roster "Last activity" (throttled inside the RPC).
  // Runs after the response so navigation is not blocked. A bare unawaited
  // call is cancelled when the proxy returns; after() is not.
  if (isAppPath(path)) {
    after(async () => {
      const { error } = await supabase.rpc("touch_last_seen");
      if (error) {
        console.error("touch_last_seen failed:", error.message);
      }
    });
  }

  return applyGate(supabaseResponse);
}
