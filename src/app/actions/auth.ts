"use server";

import { emailSchema } from "@/lib/auth/validation";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
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
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Sign-out failed. Please try again.");
    (await cookies()).delete("medintel-recovery");
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

export async function requestMagicLinkAction(email: string, captchaToken?: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  const trimmed = parsed.data;
  if (!allowAuthAttempt("magic-link", trimmed)) return { ok: false, error: "Too many attempts. Try again later." };

  const supabase = await createCookieClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredOrigin && process.env.NODE_ENV === "production") return { ok: false, error: "Authentication site URL is not configured." };
  const origin = configuredOrigin || "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      shouldCreateUser: false,
      captchaToken,
    },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit") return { ok: false, error: "Email sending is temporarily rate-limited. Wait before requesting another link. Contact your administrator if this continues." };
    return { ok: false, error: "Could not request a magic link. Try again later." };
  }
  return { ok: true };
}
