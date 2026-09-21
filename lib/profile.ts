import type { Category } from "@/lib/ui";
import { TALENT_PROFILE as FROM_STORE } from "@/lib/talentMock";
import type { AgeBracket } from "@/lib/onboarding";

export type ProfilePlatform = {
  id: string;
  platform: string;
  followers: number;
  category: Category;
  handle?: string | null;
};

export type TalentProfileData = {
  name: string;
  email: string | null;
  ageBracket: AgeBracket;
  memberSince: string;
  communityLabel: string;
  niches: string;
  platforms: ProfilePlatform[];
};

export const TALENT_PROFILE: TalentProfileData = FROM_STORE;

export const PROFILE_ACCOUNT_ROWS = [
  {
    title: "Edit profile",
    description: "Name, age bracket, platforms & community size",
    href: "/home/profile/edit",
  },
] as const;

export const PROFILE_APP_ROWS = [
  {
    title: "Notifications",
    href: "/home/profile/coming-soon?f=Notifications",
  },
  {
    title: "Appearance",
    href: "/home/profile/coming-soon?f=Appearance",
  },
  {
    title: "Help & support",
    href: "/home/profile/coming-soon?f=Help%20%26%20support",
  },
] as const;
