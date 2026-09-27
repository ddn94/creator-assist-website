import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
