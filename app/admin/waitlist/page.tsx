import { AppFrame } from "@/components/AppFrame";
import { Text } from "@/components/Text";
import { WaitlistTable } from "@/components/WaitlistTable";
import { requireAdmin } from "@/lib/auth/session";
import { listWaitlist } from "@/lib/data/waitlist";
import { supabaseServiceRoleKey } from "@/lib/supabase/env";

export default async function AdminWaitlistPage() {
  const profile = await requireAdmin();

  if (!supabaseServiceRoleKey()) {
    return (
      <AppFrame
        role={profile.role}
        profile={profile}
        title="Waitlist"
        description="Invite codes for people who joined from the landing page"
      >
        <Text variant="description">
          Add <code className="font-mono text-ink">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          to your env (Project Settings → API → secret key) so this page can read
          the waitlist table. Keep it server-only — never{" "}
          <code className="font-mono text-ink">NEXT_PUBLIC_*</code>.
        </Text>
      </AppFrame>
    );
  }

  const items = await listWaitlist();
  const pending = items.filter((item) => !item.consumedAt).length;

  return (
    <AppFrame
      role={profile.role}
      profile={profile}
      title="Waitlist"
      description={`${items.length} total · ${pending} pending · Copy a code and email it yourself`}
    >
      <WaitlistTable items={items} />
    </AppFrame>
  );
}
