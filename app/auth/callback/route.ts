import { NextResponse } from "next/server";
import { appHome } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) return NextResponse.redirect(new URL(next, url.origin));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed_at")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          return NextResponse.redirect(new URL(appHome(profile), url.origin));
        }
      }
      return NextResponse.redirect(new URL("/login", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
