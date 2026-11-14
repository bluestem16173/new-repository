"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { recordSecurityAuditEvent } from "@/lib/security/audit";

async function createCookieClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function signOutAction(): Promise<void> {
  const supabase = await createCookieClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    if (user) {
      await recordSecurityAuditEvent({
        actorId: user.id,
        eventType: "sign_out",
        resourceType: "auth",
        resourceId: user.id,
        outcome: "success",
        metadata: {},
      }).catch(() => undefined);
    }
  }
  redirect("/login");
}

export async function requestMagicLinkAction(email: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Email is required." };

  const supabase = await createCookieClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
