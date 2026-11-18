import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  hasSupabaseEnv,
  supabaseEnv,
  supabaseServiceRoleKey,
} from "@/lib/supabase/env";

/**
 * Mobile (Bearer token) waitlist admin read.
 * Same gate as /admin/waitlist: signed-in email must be in ADMIN_EMAILS.
 */
export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = auth.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = supabaseServiceRoleKey();
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Waitlist admin is not configured. Add SUPABASE_SERVICE_ROLE_KEY." },
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

  if (userError || !user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("waitlist")
    .select("id, email, invite_code, created_at, consumed_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    inviteCode: String(row.invite_code),
    createdAt: String(row.created_at),
    consumedAt: typeof row.consumed_at === "string" ? row.consumed_at : null,
  }));

  return NextResponse.json({ items });
}
