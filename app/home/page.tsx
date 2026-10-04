import { TalentOverview } from "@/components/TalentOverview";
import { AppFrame } from "@/components/AppFrame";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";
import { listMyContent } from "@/lib/data/contentQueries";
import { listMyIdeas } from "@/lib/data/ideaQueries";
import { getMyAgencyLink, getMyConnectionRequests } from "@/lib/data/talentRecords";
import {
  buildContinueFeed,
  buildOverviewStats,
} from "@/lib/data/selectors";
import { localToday } from "@/lib/localToday";

export default async function TalentHomePage() {
  const profile = await requireProfile("talent");
  const currency = profile.currency?.trim() || "USD";
  const [content, ideas, agencyLink, connectionRequests] = await Promise.all([
    listMyContent(),
    listMyIdeas(),
    getMyAgencyLink(),
    getMyConnectionRequests(),
  ]);
  const stats = buildOverviewStats(content, currency, await localToday());
  const feed = buildContinueFeed(content, ideas);

  return (
    <AppFrame role="talent" profile={profile}>
      <TalentOverview
        userName={displayName(profile)}
        avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
        stats={stats}
        feed={feed}
        agencyName={
          agencyLink?.status === "active" ? agencyLink.agencyName : null
        }
        connectionRequests={connectionRequests}
      />
    </AppFrame>
  );
}
