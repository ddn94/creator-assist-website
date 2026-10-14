import { getProfile } from "@/lib/auth/session";

/**
 * While the product tour is pending, the layout already rendered every
 * tour screen. The matching route page would only fetch the same data again.
 */
export async function tourCoversPage(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.onboarding.productTour === "pending";
}
