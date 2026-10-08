import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { localDayIso } from "@/lib/localToday";

/** The person's local calendar day. Prefer this over the server clock. */
export async function todayIso() {
  return localDayIso();
}

export function revalidateContent(paths: string[] = []) {
  revalidatePath("/overview");
  revalidatePath("/overview/tracker");
  revalidatePath("/overview/payments");
  revalidatePath("/overview/pnl");
  revalidatePath("/overview/ideas");
  revalidatePath("/workspace");
  revalidatePath("/workspace/payments");
  revalidatePath("/workspace/pnl");
  revalidatePath("/workspace/talent", "layout");
  for (const path of paths) revalidatePath(path);
}

export async function requireTalentId() {
  const profile = await getProfile();
  if (!profile || profile.role !== "talent") {
    throw new Error("Sign in as a creator to manage content.");
  }
  return profile.id;
}
