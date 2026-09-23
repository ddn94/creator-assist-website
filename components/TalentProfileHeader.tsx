import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
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
    `${talent.community} community`,
    talent.platformsFull,
    talent.niches,
    talent.location,
  ].join(" · ");

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
        <Avatar name={talent.name} size="lg" />
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
        </div>
      </div>
      {/* <Button type="button" size="sm" variant="secondary" className="w-full sm:w-auto">
        Message
      </Button> */}
    </div>
  );
}
