import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { localDayIso } from "@/lib/localToday";

/** The person's local calendar day. Prefer this over the server clock. */
export async function todayIso() {
  return localDayIso();
}

export function revalidateContent(paths: string[] = []) {
  revalidatePath("/home");
  revalidatePath("/home/tracker");
  revalidatePath("/home/payments");
  revalidatePath("/home/pnl");
  revalidatePath("/home/ideas");
  revalidatePath("/workspace");
  revalidatePath("/workspace/payments");
  revalidatePath("/workspace/pnl");
  revalidatePath("/workspace/talent", "layout");
  for (const path of paths) revalidatePath(path);
}

export async function requireTalentId() {
  const profile = await getProfile();
  if (!profile || profile.role !== "talent") {
    throw new Error("Sign in as talent to manage content.");
  }
  return profile.id;
}
