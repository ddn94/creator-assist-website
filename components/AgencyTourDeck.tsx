import { Suspense, type ReactNode } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/Button";
import { AppFrame } from "@/components/AppFrame";
import { AgencyOverview } from "@/components/AgencyOverview";
import { PaymentList } from "@/components/PaymentList";
import { PnlDashboard } from "@/components/PnlDashboard";
import type { RosterItem } from "@/components/RosterList";
import { TalentDetailView } from "@/components/TalentDetailView";
import { TalentTable } from "@/components/TalentTable";
import { WorkspaceShell } from "@/components/RoleShell";
import { TourChrome, TourDealGate, TourPanels } from "@/components/TourStage";
import type { Profile } from "@/lib/auth/types";
import { listContentChanges } from "@/lib/data/contentChanges";
import { listAgencyLinkedContent, listContentForTalentRecord } from "@/lib/data/contentQueries";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import {
  buildAgencyAttention,
  buildAgencyOverviewMoney,
  buildAgencyPayments,
  buildTalentDetailFromRecord,
  buildTalentRoster,
} from "@/lib/data/selectors";
import { listTalentRecords } from "@/lib/data/talentRecords";
import { toTalentItem } from "@/lib/data/talentItem";
import { localToday } from "@/lib/localToday";
import { contentPlatformOptions } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";
import { talentStatusTone, type TalentItem } from "@/lib/talent";
import { tourStartPath } from "@/lib/tour";

const HREFS = ["/workspace", "/workspace/talent", "/workspace/payments", "/workspace/pnl"];

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
  const disconnected = items.filter((item) => item.status === "disconnected").length;
  const requested = items.filter((item) => item.status === "requested").length;
  const summary = `${active} active · ${invited} invited · ${record} record`;
  return [summary, disconnected ? `${disconnected} disconnected` : "", requested ? `${requested} requested` : ""]
    .filter(Boolean)
    .join(" · ");
}

function panel(href: string, content: ReactNode) {
  return {
    href,
    content: <Suspense fallback={null}>{content}</Suspense>,
  };
}

async function RosterPanel({ profile }: { profile: Profile }) {
  const [records, linked, avatars] = await Promise.all([
    listTalentRecords(),
    listAgencyLinkedContent(),
    getLinkedTalentAvatars(profile.id),
  ]);
  return (
    <AppFrame
      role="agency"
      profile={profile}
      title="Talent"
      description="Everyone you manage, on or off Creator Assist"
      action={
        <Button
          href="/workspace/talent/new"
          size="sm"
          variant="primary"
          iconLeft={<PlusIcon size={16} weight="bold" />}
          className="w-full sm:w-auto"
        >
          Add talent
        </Button>
      }
    >
      <TalentTable items={buildTalentRoster(records, linked, avatars)} />
    </AppFrame>
  );
}

async function DealPanel({ profile }: { profile: Profile }) {
  const records = await listTalentRecords();
  const first = records[0];
  if (!first) return null;
  const href = `/workspace/talent/${first.id}`;
  const supabase = await createClient();
  const [content, avatars] = await Promise.all([
    listContentForTalentRecord(first),
    getLinkedTalentAvatars(profile.id),
  ]);
  const activity = await listContentChanges(
    supabase,
    content.map((item) => item.id),
  );
  const today = await localToday();
  return (
    <TourDealGate href={href}>
      <AppFrame role="agency" profile={profile}>
        <TalentDetailView
          talent={buildTalentDetailFromRecord(
            first,
            content,
            today,
            avatars.get(first.id) ?? null,
            activity,
          )}
          inviteCode={first.invite_code}
          declinedAt={first.declined_at}
          recordEmail={first.email}
          backHref="/workspace/talent"
          backLabel="Talent"
          canAddContent={first.status === "record"}
          joined={first.linked_user_id != null}
          platformOptions={contentPlatformOptions(first.platform ? [first.platform] : [])}
        />
      </AppFrame>
    </TourDealGate>
  );
}

async function PaymentsPanel({ profile }: { profile: Profile }) {
  const linked = await listAgencyLinkedContent();
  const items = buildAgencyPayments(linked, await localToday());
  return (
    <AppFrame
      role="agency"
      profile={profile}
      title="Payments"
      description="Every deal across the roster · you set invoice dates and terms"
    >
      <PaymentList mode="agency" items={items} />
    </AppFrame>
  );
}

async function PnlPanel({ profile }: { profile: Profile }) {
  const homeCurrency = profile.currency?.trim() || "USD";
  const linkedRows = await listAgencyLinkedContent();
  return (
    <AppFrame
      role="agency"
      profile={profile}
      title="P&L"
      description="Revenue, expenses, and profit across the roster"
    >
      <PnlDashboard linkedRows={linkedRows} homeCurrency={homeCurrency} />
    </AppFrame>
  );
}

async function OverviewPanel({ profile }: { profile: Profile }) {
  const homeCurrency = profile.currency?.trim() || "USD";
  const today = await localToday();
  const [records, avatars, linked] = await Promise.all([
    listTalentRecords(),
    getLinkedTalentAvatars(profile.id),
    listAgencyLinkedContent(),
  ]);
  const talent = records.map((record) =>
    toTalentItem(record, avatars.get(record.id) ?? null),
  );
  const brand = profile.agency_name?.trim() || "Workspace";
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
        moneyStats={buildAgencyOverviewMoney(linked, homeCurrency, today)}
        attention={buildAgencyAttention(linked, today)}
        payments={buildAgencyPayments(linked, today)}
      />
    </AppFrame>
  );
}

export async function AgencyTourDeck({ profile }: { profile: Profile }) {
  return (
    <TourChrome homeHref="/workspace" startHref={tourStartPath("agency")} hrefs={HREFS}>
      <WorkspaceShell profile={profile}>
        <TourPanels
          slots={[
            panel("/workspace/talent", <RosterPanel profile={profile} />),
            panel("/workspace/payments", <PaymentsPanel profile={profile} />),
            panel("/workspace/pnl", <PnlPanel profile={profile} />),
            panel("/workspace", <OverviewPanel profile={profile} />),
          ]}
        />
        <Suspense fallback={null}>
          <DealPanel profile={profile} />
        </Suspense>
      </WorkspaceShell>
    </TourChrome>
  );
}
