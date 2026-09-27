import { AgencyOverview } from "@/components/AgencyOverview";
import { AppFrame } from "@/components/AppFrame";
import type { RosterItem } from "@/components/RosterList";
import { requireProfile } from "@/lib/auth/session";
import { listTalentRecords } from "@/lib/data/talentRecords";
import { toTalentItem } from "@/lib/data/talentItem";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";
import {
  buildAgencyAttention,
  buildAgencyOverviewMoney,
  buildAgencyPayments,
} from "@/lib/data/selectors";
import { talentStatusTone, type TalentItem } from "@/lib/talent";

function rosterItems(items: TalentItem[]): RosterItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    platforms: item.platformsFull,
    status: item.statusLabel,
    statusTone: talentStatusTone[item.status],
    meta: item.email ?? item.lastActivity,
    avatarUrl: item.avatarUrl,
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
  const [records, avatars, linked] = await Promise.all([
    listTalentRecords(),
    getLinkedTalentAvatars(profile.id),
    listAgencyLinkedContent(),
  ]);
  const talent = records.map((record) =>
    toTalentItem(record, avatars.get(record.id) ?? null),
  );
  const brand = profile.agency_name?.trim() || "Workspace";
  const homeCurrency = profile.currency?.trim() || "USD";
  const moneyStats = buildAgencyOverviewMoney(linked, homeCurrency);
  const attention = buildAgencyAttention(linked);
  const payments = buildAgencyPayments(linked);

  return (
    <AppFrame
      role="agency"
      profile={profile}
      title="Overview"
      description={`${brand} · ${talent.length} talent`}
    >
      <AgencyOverview
        talentCount={talent.length}
        talentFooter={talentFooter(talent)}
        roster={rosterItems(talent)}
        moneyStats={moneyStats}
        attention={attention}
        payments={payments}
      />
    </AppFrame>
  );
}
