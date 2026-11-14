/**
 * Detects whether Supabase is configured for server-side persistence.
 * Demo mode is the default when env vars are absent — never imply demo writes persist.
 *
 * Public key alias: prefer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, fall back to
 * NEXT_PUBLIC_SUPABASE_ANON_KEY so either name works.
 */

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Browser-safe public API key (publishable or legacy anon).
 * Never returns the service-role / secret key.
 */
export function getSupabasePublishableKey(): string | undefined {
  return (
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseUrl(): string | undefined {
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabasePublishableKey();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
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
  return trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? null;
}

export function getRuntimeMode(): "supabase" | "demo" {
  // Partial configuration must not silently open the synthetic runtime.
  return getSupabaseUrl() || getSupabasePublishableKey() ? "supabase" : "demo";
}
