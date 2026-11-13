/**
 * Detects whether Supabase is configured for server-side persistence.
 * Demo mode is the default when env vars are absent — never imply demo writes persist.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}

/**
 * Service-role key must only be read on the server. Never import this in client components.
 */
export function getSupabaseServiceRoleKey(): string | null {
  if (typeof window !== "undefined") {
    throw new Error(
      "Service-role key must never be accessed from the browser.",
    );
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export function getRuntimeMode(): "supabase" | "demo" {
  return isSupabaseConfigured() ? "supabase" : "demo";
}
