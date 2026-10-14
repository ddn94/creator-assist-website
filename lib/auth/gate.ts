import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived copy of role + onboarding, so the proxy can skip the profile read. */
export const GATE_COOKIE = "ca_gate";
const GATE_MAX_AGE_SEC = 30 * 60;

export type Gate = {
  sub: string;
  role: "talent" | "agency";
  onboarded: boolean;
  exp: number;
};

export const gateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: GATE_MAX_AGE_SEC,
};

let warnedMissingSecret = false;

/** Server-only HMAC key. Unsigned cookies are ignored. */
function gateSecret(): string | null {
  const secret = process.env.GATE_SECRET?.trim() ?? "";
  if (secret.length >= 32) return secret;
  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.error(
      "GATE_SECRET is missing or shorter than 32 characters. Gate cookies are ignored.",
    );
  }
  return null;
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function encodeGate(
  gate: Pick<Gate, "sub" | "role" | "onboarded">,
  now = Date.now(),
): string | null {
  const secret = gateSecret();
  if (!secret) return null;
  const payload: Gate = {
    ...gate,
    exp: now + GATE_MAX_AGE_SEC * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function decodeGate(
  raw: string | undefined | null,
  now = Date.now(),
): Gate | null {
  const secret = gateSecret();
  if (!secret || !raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  if (!mac || !signaturesMatch(mac, sign(body, secret))) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<Gate>;
    if (parsed.role !== "talent" && parsed.role !== "agency") return null;
    if (typeof parsed.sub !== "string" || !parsed.sub) return null;
    if (typeof parsed.onboarded !== "boolean") return null;
    if (typeof parsed.exp !== "number" || parsed.exp <= now) return null;
    return {
      sub: parsed.sub,
      role: parsed.role,
      onboarded: parsed.onboarded,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
