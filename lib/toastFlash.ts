import { cookies } from "next/headers";

const TOAST_COOKIE = "ca-toast";

export async function flashToast(
  message: string,
  tone: "success" | "danger" = "success",
) {
  const jar = await cookies();
  const value = Buffer.from(JSON.stringify({ message, tone }), "utf8").toString(
    "base64url",
  );
  jar.set(TOAST_COOKIE, value, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}
