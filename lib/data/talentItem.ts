import { avatarPublicUrl } from "@/lib/auth/avatar";
import { countryName } from "@/lib/countries";
import type { LinkedTalentMeta } from "@/lib/data/linkedTalent";
import type { TalentRecord } from "@/lib/data/talentRecords";
import { fmtFollowers } from "@/lib/profileFormOptions";
import type { TalentItem, TalentStatus } from "@/lib/talent";
import { formatRelativeActivity, formatShortDayMonth } from "@/lib/time";

function statusLabel(status: TalentStatus) {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  return "Record only";
}

function activityLabel(
  record: TalentRecord,
  lastSeenAt?: string | null,
): string {
  if (lastSeenAt) return formatRelativeActivity(lastSeenAt);

  if (record.status === "invited") {
    const when = record.updated_at || record.created_at;
    return `Invite sent on ${formatShortDayMonth(when)}`;
  }

  if (record.status === "active") {
    return `Joined ${formatShortDayMonth(record.updated_at || record.created_at)}`;
  }

  return `Added ${formatShortDayMonth(record.created_at)}`;
}

function formatPlatformPair(platform: string, handle: string) {
  const p = platform.trim();
  const h = handle.trim();
  if (!p) return "";
  return h ? `${p} · ${h}` : p;
}

function platformsFromRecord(record: TalentRecord) {
  const label = formatPlatformPair(record.platform ?? "", record.handle ?? "");
  return {
    platforms: label || "No platform yet",
    platformsFull: label || "No platform yet",
    community:
      record.followers && record.followers > 0
        ? fmtFollowers(record.followers)
        : "",
  };
}

function platformsFromLive(meta: LinkedTalentMeta) {
  if (meta.platforms.length === 0) return null;
  const labels = meta.platforms
    .map((row) => formatPlatformPair(row.platform, row.handle))
    .filter(Boolean);
  if (labels.length === 0) return null;
  const totalFollowers = meta.platforms.reduce(
    (sum, row) => sum + row.followers,
    0,
  );
  const joined = labels.join(", ");
  return {
    platforms: joined,
    platformsFull: joined,
    community: totalFollowers > 0 ? fmtFollowers(totalFollowers) : "",
  };
}

export function toTalentItem(
  record: TalentRecord,
  meta?: LinkedTalentMeta | null,
): TalentItem {
  const linked = !!meta;
  const platforms = linked
    ? platformsFromLive(meta) ?? {
        platforms: "No platform yet",
        platformsFull: "No platform yet",
        community: "",
      }
    : platformsFromRecord(record);

  return {
    id: record.id,
    name: (linked ? meta.displayName : null) || record.name,
    email: record.email,
    status: record.status,
    statusLabel: statusLabel(record.status),
    platforms: platforms.platforms,
    platformsFull: platforms.platformsFull,
    community: platforms.community,
    niches: linked ? meta.niche ?? "" : record.niche ?? "",
    location: linked
      ? meta.country
        ? countryName(meta.country)
        : ""
      : record.location
        ? countryName(record.location)
        : "",
    liveDeals: null,
    outstanding: null,
    lastActivity: activityLabel(record, meta?.lastSeenAt),
    avatarUrl: meta
      ? avatarPublicUrl(meta.avatarPath, meta.updatedAt)
      : null,
  };
}
