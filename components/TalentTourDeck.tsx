import { Suspense, type ReactNode } from "react";
import { ContentTracker } from "@/components/ContentTracker";
import { AppFrame } from "@/components/AppFrame";
import { IdeasBoard } from "@/components/IdeasBoard";
import { PaymentList } from "@/components/PaymentList";
import { PaymentsOverdueBadge } from "@/components/PaymentsOverdueBadge";
import { TalentOverview } from "@/components/TalentOverview";
import { TalentPnlDashboard } from "@/components/TalentPnlDashboard";
import { TalentShell } from "@/components/RoleShell";
import { TourChrome, TourPanels } from "@/components/TourStage";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { asAnswers, displayName, readPlatforms } from "@/lib/auth/profileAnswers";
import type { Profile } from "@/lib/auth/types";
import { listMyContent, listMyContentItems } from "@/lib/data/contentQueries";
import { pnlMoneyContext } from "@/lib/data/exchangeRates";
import { listMyIdeas } from "@/lib/data/ideaQueries";
import { buildContinueFeed, buildOverviewStats, buildTalentPayments } from "@/lib/data/selectors";
import { getMyAgencyLink, getMyConnectionRequests } from "@/lib/data/talentRecords";
import { localToday, localTimeZone } from "@/lib/localToday";
import { contentPlatformOptions } from "@/lib/platforms";
import { tourStartPath } from "@/lib/tour";

const HREFS = ["/home", "/home/tracker", "/home/ideas", "/home/payments", "/home/pnl"];

async function TrackerPanel({ profile }: { profile: Profile }) {
  const items = await listMyContentItems();
  const tourItem =
    items.find((item) => item.title === "Sample paid collab") ?? items[0];
  const platformOptions = contentPlatformOptions(
    readPlatforms(asAnswers(profile.onboarding)).map((row) => row.platform),
  );
  return (
    <AppFrame
      role="talent"
      profile={profile}
      title="Content Tracker"
      description="Concept to Go Live · every piece in one place"
    >
      <Suspense fallback={null}>
        <ContentTracker
          items={items}
          platformOptions={platformOptions}
          initialStage={tourItem?.stage}
          tourItemId={tourItem?.id}
        />
      </Suspense>
    </AppFrame>
  );
}

async function IdeasPanel({ profile }: { profile: Profile }) {
  const ideas = await listMyIdeas();
  return (
    <AppFrame
      role="talent"
      profile={profile}
      title="Ideas"
      description="Brain dump · jot it down, organize later"
    >
      <IdeasBoard ideas={ideas} />
    </AppFrame>
  );
}

async function PaymentsPanel({ profile }: { profile: Profile }) {
  const currency = profile.currency?.trim() || "USD";
  const [content, today, timeZone] = await Promise.all([
    listMyContent(),
    localToday(),
    localTimeZone(),
  ]);
  const items = buildTalentPayments(content, currency, today, timeZone);
  const overdueCount = items.filter((item) => item.status === "overdue").length;
  return (
    <AppFrame
      role="talent"
      profile={profile}
      title="Payment Tracker"
      description="What’s owed, invoiced, and paid"
      action={<PaymentsOverdueBadge count={overdueCount} />}
    >
      <PaymentList mode="talent" items={items} />
    </AppFrame>
  );
}

async function PnlPanel({ profile }: { profile: Profile }) {
  const currency = profile.currency?.trim() || "USD";
  const allContent = await listMyContent();
  const money = await pnlMoneyContext(currency, allContent);
  return (
    <AppFrame
      role="talent"
      profile={profile}
      title="P&L Dashboard"
      description="Revenue, expenses, and profit"
    >
      <TalentPnlDashboard
        allContent={allContent}
        currency={currency}
        currencies={money.currencies}
        rates={money.rates}
      />
    </AppFrame>
  );
}

async function OverviewPanel({ profile }: { profile: Profile }) {
  const currency = profile.currency?.trim() || "USD";
  const [content, ideas, agencyLink, connectionRequests, today, timeZone] =
    await Promise.all([
      listMyContent(),
      listMyIdeas(),
      getMyAgencyLink(),
      getMyConnectionRequests(),
      localToday(),
      localTimeZone(),
    ]);
  return (
    <AppFrame role="talent" profile={profile}>
      <TalentOverview
        userName={displayName(profile)}
        avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
        stats={buildOverviewStats(content, currency, today, timeZone)}
        feed={buildContinueFeed(content, ideas)}
        agencyName={agencyLink?.status === "active" ? agencyLink.agencyName : null}
        connectionRequests={connectionRequests}
      />
    </AppFrame>
  );
}

function panel(href: string, content: ReactNode) {
  return {
    href,
    content: <Suspense fallback={null}>{content}</Suspense>,
  };
}

export async function TalentTourDeck({ profile }: { profile: Profile }) {
  return (
    <TourChrome homeHref="/home" startHref={tourStartPath("talent")} hrefs={HREFS}>
      <TalentShell profile={profile}>
        <TourPanels
          slots={[
            panel("/home/tracker", <TrackerPanel profile={profile} />),
            panel("/home/ideas", <IdeasPanel profile={profile} />),
            panel("/home/payments", <PaymentsPanel profile={profile} />),
            panel("/home/pnl", <PnlPanel profile={profile} />),
            panel("/home", <OverviewPanel profile={profile} />),
          ]}
        />
      </TalentShell>
    </TourChrome>
  );
}
