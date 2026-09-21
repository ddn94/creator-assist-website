"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CategoryPill } from "@/components/CategoryPill";
import { SettingsRow } from "@/components/SettingsRow";
import { Text } from "@/components/Text";
import { fmtFollowers } from "@/lib/onboarding";
import { PROFILE_ACCOUNT_ROWS, PROFILE_APP_ROWS } from "@/lib/profile";
import { resetMockDb } from "@/lib/mockStore";
import { useSelfProfile } from "@/lib/useMockDb";

type TalentProfileProps = {
  className?: string;
};

export function TalentProfile({ className = "" }: TalentProfileProps) {
  const router = useRouter();
  const profile = useSelfProfile();

  return (
    <div
      className={["mx-auto w-full max-w-xl", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Text
        as="h1"
        variant="title"
        className="mb-6 text-center text-xl sm:text-xl"
      >
        Profile
      </Text>

      <div className="mb-7 text-center">
        <Avatar name={profile.name} size="xl" />
        <Text as="h2" variant="heading" className="mt-3 text-2xl sm:text-2xl">
          {profile.name}
        </Text>
        <Text variant="description" className="mt-1">
          {profile.memberSince}
        </Text>
        {profile.platforms.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {profile.platforms.map((platform) => (
              <CategoryPill key={platform.id} category={platform.category}>
                {platform.platform}
                {platform.followers > 0
                  ? ` · ${fmtFollowers(platform.followers)}`
                  : ""}
              </CategoryPill>
            ))}
          </div>
        ) : null}
      </div>

      <Text variant="label" className="mb-2 px-1">
        Account
      </Text>
      <div className="mb-6 space-y-3">
        {PROFILE_ACCOUNT_ROWS.map((row) => (
          <SettingsRow
            key={row.title}
            title={row.title}
            description={row.description}
            href={row.href}
          />
        ))}
      </div>

      <Text variant="label" className="mb-2 px-1">
        App
      </Text>
      <div className="mb-6 space-y-3">
        {PROFILE_APP_ROWS.map((row) => (
          <SettingsRow key={row.title} title={row.title} href={row.href} />
        ))}
        <SettingsRow
          title="Sign out"
          onClick={() => {
            resetMockDb();
            router.push("/auth/login");
          }}
        />
      </div>
    </div>
  );
}
