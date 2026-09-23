import { AgencyOverview } from "@/components/AgencyOverview";
import type { RosterItem } from "@/components/RosterList";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";
import { listTalentRecords, toTalentItem } from "@/lib/auth/talentRecords";
import { talentStatusTone, type TalentItem } from "@/lib/talent";

function rosterItems(items: TalentItem[]): RosterItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    platforms: item.platformsFull,
    status: item.statusLabel,
    statusTone: talentStatusTone[item.status],
    meta: item.email ?? item.lastActivity,
  }));
}

function talentFooter(items: TalentItem[]) {
  const active = items.filter((item) => item.status === "active").length;
  const invited = items.filter((item) => item.status === "invited").length;
  const record = items.filter((item) => item.status === "record").length;
  return `${active} active · ${invited} invited · ${record} record`;
}

export default async function WorkspaceOverviewPage() {
  const profile = await requireProfile("agency");
  const talent = (await listTalentRecords()).map(toTalentItem);
  const brand = profile.agency_name?.trim() || "Workspace";

  return (
    <AgencyOverview
      userName={displayName(profile)}
      userEmail={profile.email}
      brand={brand}
      avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
      description={`${brand} · ${talent.length} talent`}
      talentCount={talent.length}
      talentFooter={talentFooter(talent)}
      roster={rosterItems(talent)}
    />
  );
}
