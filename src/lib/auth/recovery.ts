import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Hosted replicas must share this secret. Development fallback is ephemeral.
let developmentSecret: string | undefined;
function secret(): string {
  const configured = process.env.MEDINTEL_AUTH_RECOVERY_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("Recovery signing is not configured.");
  return developmentSecret ??= randomBytes(32).toString("hex");
}
export function issueRecoveryMarker(userId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ userId, expires: now + 600_000, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
export function readRecoveryMarker(value: string | undefined, now?: number): string | null {
  if (!value || value.length > 1024) return null;
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.userId === "string" && typeof data.expires === "number" && data.expires > (now ?? Date.now()) ? data.userId : null;
  } catch { return null; }
}
