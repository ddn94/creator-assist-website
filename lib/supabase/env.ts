export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return { url, publishableKey };
}

/** Server-only key for admin reads (waitlist). Never expose as NEXT_PUBLIC_*. */
export function supabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export const SUPABASE_SETUP_ERROR =
  "Supabase is not configured yet. Add the env vars from supabase/env.example.";

/** Shared failure for AuthFormState actions. */
export function supabaseSetupAuthFailure(): {
  error: string;
  message: null;
} {
  return { error: SUPABASE_SETUP_ERROR, message: null };
}

/** Shared failure for `{ error }` actions (profile, avatar). */
export function supabaseSetupError(): { error: string } {
  return { error: SUPABASE_SETUP_ERROR };
}

/**
 * Wrap a form server action so the env guard isn’t copy-pasted.
 * Returns the shared setup failure when Supabase isn’t configured.
 */
export function withSupabaseFormAction<Prev, Result extends { error: string | null }>(
  action: (prev: Prev, formData: FormData) => Promise<Result>,
  onMissing: () => Result,
): (prev: Prev, formData: FormData) => Promise<Result> {
  return async (prev, formData) => {
    if (!hasSupabaseEnv()) return onMissing();
    return action(prev, formData);
  };
}

/** Convenience for the usual AuthFormState actions. */
export function withSupabaseAuthAction<Prev>(
  action: (
    prev: Prev,
    formData: FormData,
  ) => Promise<{ error: string | null; message: string | null }>,
) {
  return withSupabaseFormAction(action, supabaseSetupAuthFailure);
}
