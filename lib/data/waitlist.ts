import { createServiceClient } from "@/lib/supabase/admin";

export type WaitlistEntry = {
  id: string;
  email: string;
  inviteCode: string;
  createdAt: string;
  consumedAt: string | null;
};

/**
 * Lists waitlist rows for the admin UI. Uses the service-role client because
 * public.waitlist has no select grant for authenticated users. Call only after
 * requireAdmin().
 */
export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("waitlist")
    .select("id, email, invite_code, created_at, consumed_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    inviteCode: String(row.invite_code),
    createdAt: String(row.created_at),
    consumedAt: typeof row.consumed_at === "string" ? row.consumed_at : null,
  }));
}
