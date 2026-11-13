import { afterEach, describe, expect, it } from "vitest";
import {
  getRuntimeMode,
  getSupabasePublicConfig,
  getSupabasePublishableKey,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const snapshot: Record<string, string | undefined> = {};

function clearKeys() {
  for (const key of KEYS) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }
}

function restoreKeys() {
  for (const key of KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

afterEach(() => {
  restoreKeys();
});

describe("supabase env aliases", () => {
  it("uses publishable key when both are set", () => {
    clearKeys();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_legacy";

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabasePublishableKey()).toBe("sb_publishable_test");
    expect(getSupabasePublicConfig()?.anonKey).toBe("sb_publishable_test");
    expect(getRuntimeMode()).toBe("supabase");
  });

  it("falls back to anon key when publishable is absent", () => {
    clearKeys();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_legacy";

    expect(getSupabasePublishableKey()).toBe("anon_legacy");
    expect(getRuntimeMode()).toBe("supabase");
  });

  it("stays in demo mode when keys are missing", () => {
    clearKeys();
    expect(isSupabaseConfigured()).toBe(false);
    expect(getRuntimeMode()).toBe("demo");
    expect(getSupabasePublicConfig()).toBeNull();
  });
});
