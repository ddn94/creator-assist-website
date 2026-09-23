import { CategoryPill } from "@/components/CategoryPill";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { SettingsRow } from "@/components/SettingsRow";
import { Text } from "@/components/Text";
import { signOut } from "@/lib/auth/actions";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import {
  displayName,
  memberSinceLabel,
  readPlatforms,
  readString,
} from "@/lib/auth/onboarding";
import type { Profile } from "@/lib/auth/types";
import { countryName } from "@/lib/countries";
import { fmtFollowers, ROSTER_OPTIONS } from "@/lib/onboarding";
import { PROFILE_APP_ROWS } from "@/lib/profile";
import { platformCategoryFor } from "@/lib/mockStore";

type AccountProfileProps = {
  profile: Profile;
  editHref: string;
  showAppLinks?: boolean;
};

function rosterLabel(value: string) {
  return ROSTER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function AccountProfile({
  profile,
  editHref,
  showAppLinks = false,
}: AccountProfileProps) {
  const name = displayName(profile);
  const platforms = readPlatforms(profile.onboarding);
  const country = profile.country ? countryName(profile.country) : "";
  const roster = readString(profile.onboarding, "rosterSize");

  return (
    <div className="mx-auto w-full max-w-xl">
      <Text as="h1" variant="title" className="mb-6 text-center text-xl sm:text-xl">
        Profile
      </Text>

      <div className="mb-7 text-center">
        <ProfilePhoto
          userId={profile.id}
          name={name}
          src={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
        />
        <Text as="h2" variant="heading" className="mt-3 text-2xl sm:text-2xl">
          {name}
        </Text>
        <Text variant="description" className="mt-1">
          {memberSinceLabel(profile.created_at)}
          {country ? ` · ${country}` : ""}
        </Text>
        {profile.role === "agency" && profile.agency_name ? (
          <Text variant="description" className="mt-1">
            {profile.agency_name}
            {roster ? ` · ${rosterLabel(roster)}` : ""}
          </Text>
        ) : null}
        {platforms.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {platforms.map((platform) => (
              <CategoryPill
                key={platform.platform}
                category={platformCategoryFor(platform.platform)}
              >
                {platform.platform}
                {platform.followers > 0 ? ` · ${fmtFollowers(platform.followers)}` : ""}
              </CategoryPill>
            ))}
          </div>
        ) : null}
      </div>

      <Text variant="label" className="mb-2 px-1">
        Account
      </Text>
      <div className="mb-6 space-y-3">
        <SettingsRow
          title="Edit profile"
          description={
            profile.role === "agency"
              ? "Agency name, your name, country, and roster size"
              : "Name, age bracket, country, platforms, and community size"
          }
          href={editHref}
        />
      </div>

      {showAppLinks ? (
        <>
          <Text variant="label" className="mb-2 px-1">
            App
          </Text>
          <div className="mb-6 space-y-3">
            {PROFILE_APP_ROWS.map((row) => (
              <SettingsRow key={row.title} title={row.title} href={row.href} />
            ))}
          </div>
        </>
      ) : null}

      <form action={signOut}>
        <SettingsRow title="Sign out" submit />
      </form>
    </div>
  );
}
