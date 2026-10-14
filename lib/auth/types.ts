export type UserRole = "talent" | "agency";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  avatar_path: string | null;
  agency_name: string | null;
  country: string | null;
  currency: string | null;
  onboarding: Record<string, unknown>;
  onboarding_completed_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthFormState = {
  error: string | null;
  message: string | null;
};

export const EMPTY_AUTH_STATE: AuthFormState = {
  error: null,
  message: null,
};
