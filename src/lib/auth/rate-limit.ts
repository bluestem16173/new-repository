import { createHash } from "node:crypto";

// Supplemental per-process protection. Supabase Auth rate limits and CAPTCHA are
// the authoritative distributed controls; this cache is not a distributed quota.
const attempts = new Map<string, { count: number; expires: number }>();
export function allowAuthAttempt(action: string, email: string, now = Date.now()): boolean {
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const key = createHash("sha256").update(`${action}:${email.trim().toLowerCase()}`).digest("hex");
  const entry = attempts.get(key);
  if (entry && entry.expires > now) {
    if (entry.count >= 5) return false;
    entry.count++;
    return true;
  }
  if (attempts.size >= 10_000) return false;
  attempts.set(key, { count: 1, expires: now + 15 * 60_000 });
  return true;
}
