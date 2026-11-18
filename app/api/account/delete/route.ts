import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { avatarObjectPath } from "@/lib/auth/avatar";
import {
  hasSupabaseEnv,
  supabaseEnv,
  supabaseServiceRoleKey,
} from "@/lib/supabase/env";

/**
 * Mobile (and any Bearer-token client) account deletion.
 * Verifies the user's access token, then deletes via the service role
 * so the existing DB trigger can run the handoff.
 */
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  }

  const accessToken = auth.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  }

  const serviceKey = supabaseServiceRoleKey();
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured." },
      { status: 503 },
    );
  }

  const { url, publishableKey } = supabaseEnv();
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json(
      { error: "Could not delete your account. Try again." },
      { status: 500 },
    );
  }

  await admin.storage.from("avatars").remove([avatarObjectPath(user.id)]);
  return NextResponse.json({ ok: true });
}
