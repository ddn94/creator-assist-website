import { Avatar } from "@/components/Avatar";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { talentStatusTone, type TalentDetail } from "@/lib/talent";

type TalentProfileHeaderProps = {
  talent: TalentDetail;
  className?: string;
};

export function TalentProfileHeader({
  talent,
  className = "",
}: TalentProfileHeaderProps) {
  const meta = [
    talent.community ? `${talent.community} community` : "",
    talent.platformsFull,
    talent.niches,
    talent.location,
  ]
    .filter(Boolean)
    .join(" · ");

  const notes = talent.notes?.trim() || "";

  return (
    <div
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Avatar name={talent.name} size="lg" src={talent.avatarUrl} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="heading" className="text-2xl sm:text-3xl">
              {talent.name}
            </Text>
            <StatusTag
              label={talent.statusLabel}
              tone={talentStatusTone[talent.status]}
            />
          </div>
          <Text variant="caption" className="mt-1.5 leading-relaxed">
            {meta}
          </Text>
          {notes ? (
            <Text
              variant="caption"
              className="mt-1.5 whitespace-pre-wrap leading-relaxed"
            >
              {notes}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
