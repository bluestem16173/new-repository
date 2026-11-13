"use server";

import { readRecoveryMarker } from "@/lib/auth/recovery";
import { safeNext } from "@/lib/auth/redirect";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
import { emailSchema, registrationSchema, resetPasswordSchema } from "@/lib/auth/validation";

export type AccountResult = { ok: true; destination?: string; message: string } | { ok: false; error: string };
const confirmationMessage = "If this address can be registered, check your email to confirm your account. If you already have an account, sign in or reset your password.";

function callbackUrl(flow: "registration" | "recovery"): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") throw new Error("Authentication site URL is not configured.");
  const site = new URL(configured || "http://localhost:3000");
  if (site.protocol !== "https:" && !(site.protocol === "http:" && ["localhost", "127.0.0.1"].includes(site.hostname))) throw new Error("Authentication requires a secure site URL.");
  return `${site.origin}/auth/callback?flow=${flow}&next=${flow === "recovery" ? "/reset-password" : "/onboarding"}`;
}

export async function registerAccountAction(raw: unknown, captchaToken?: string): Promise<AccountResult> {
  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid registration." };
  if (!allowAuthAttempt("register", parsed.data.email)) return { ok: false, error: "Too many attempts. Try again later." };
  try {
    const client = await createSupabaseServerClient();
    if (!client) return { ok: false, error: "Registration is unavailable until Supabase is configured." };
    const { data, error } = await client.auth.signUp({
      email: parsed.data.email, password: parsed.data.password,
      options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: callbackUrl("registration"), captchaToken },
    });
    if (error) {
      if (error.code === "over_email_send_rate_limit") return { ok: false, error: "Email sending is temporarily rate-limited. Wait before requesting another link. Contact your administrator if this continues." };
      if (error.code === "weak_password") return { ok: false, error: "This password does not meet the configured security requirements." };
      if (error.status === 429) return { ok: false, error: "Too many attempts. Try again later." };
      if (error.code === "user_already_exists" || error.code === "email_exists") return { ok: true, message: confirmationMessage };
      return { ok: false, error: "Registration could not be completed. Check the form and try again later." };
    }
    return data.session
      ? { ok: true, destination: "/onboarding", message: "Your account is ready. Organization access is pending." }
      : { ok: true, message: confirmationMessage };
  } catch {
    return { ok: false, error: "Registration is unavailable. Check authentication configuration and try again later." };
  }
}

export async function requestPasswordResetAction(email: string, captchaToken?: string): Promise<AccountResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  if (!allowAuthAttempt("recovery", parsed.data)) return { ok: false, error: "Too many attempts. Try again later." };
  try {
    const client = await createSupabaseServerClient();
    if (!client) return { ok: false, error: "Password recovery is unavailable until Supabase is configured." };
    const { error } = await client.auth.resetPasswordForEmail(parsed.data, { redirectTo: callbackUrl("recovery"), captchaToken });
    if (error?.code === "over_email_send_rate_limit") return { ok: false, error: "Email sending is temporarily rate-limited. Wait before requesting another link. Contact your administrator if this continues." };
    if (error && error.status === 429) return { ok: false, error: "Too many attempts. Try again later." };
    // Never expose whether an address exists. Delivery still requires external verification.
    if (error && !["user_not_found", "email_not_found"].includes(error.code ?? "")) return { ok: false, error: "Password recovery is unavailable. Try again later." };
    return { ok: true, message: "If an account exists for this email, you'll receive password reset instructions." };
  } catch { return { ok: false, error: "Password recovery is unavailable. Try again later." }; }
}

export async function updatePasswordAction(raw: unknown): Promise<AccountResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password." };
  const cookieStore = await cookies();
  const recoveryUserId = readRecoveryMarker(cookieStore.get("medintel-recovery")?.value);
  if (!recoveryUserId) return { ok: false, error: "Open a fresh password reset link from your email." };
  const client = await createSupabaseServerClient();
  if (!client) return { ok: false, error: "Password recovery is unavailable." };
  const { data: { user } } = await client.auth.getUser();
  if (!user || user.id !== recoveryUserId) return { ok: false, error: "Your reset session expired. Request a new link." };
  if (!allowAuthAttempt("password-update", user.id)) return { ok: false, error: "Too many attempts. Try again later." };
  const { error } = await client.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "Password could not be updated. Use a different password or request a new link." };
  cookieStore.delete("medintel-recovery");
  const { error: signOutError } = await client.auth.signOut({ scope: "global" });
  if (signOutError) return { ok: true, message: "Password updated. Sign out and sign in again to continue." };
  return { ok: true, message: "Password updated. Sign in with your new password." };
}

export async function signInWithPasswordAction(email: string, password: string, next: string, captchaToken?: string): Promise<AccountResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success || !password || password.length > 128) return { ok: false, error: "Enter a valid email and password." };
  if (!allowAuthAttempt("sign-in", parsed.data)) return { ok: false, error: "Too many attempts. Try again later." };
  try {
    const client = await createSupabaseServerClient();
    if (!client) return { ok: false, error: "Sign-in is unavailable until Supabase is configured." };
    const { error } = await client.auth.signInWithPassword({ email: parsed.data, password, options: { captchaToken } });
    if (error) return { ok: false, error: error.status === 429 ? "Too many attempts. Try again later." : "Sign-in failed. Check your credentials and email confirmation." };
    return { ok: true, destination: safeNext(next), message: "Signed in." };
  } catch { return { ok: false, error: "Sign-in is unavailable. Try again later." }; }
}
