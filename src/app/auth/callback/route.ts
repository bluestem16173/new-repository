import { issueRecoveryMarker } from "@/lib/auth/recovery";
import { safeNext } from "@/lib/auth/redirect";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Completes PKCE or explicitly typed token-hash recovery and sets session cookies.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextRaw = url.searchParams.get("next") || "/dashboard";
  const recovery = url.searchParams.get("flow") === "recovery" || type === "recovery" || nextRaw === "/reset-password";
  const next = recovery ? "/reset-password" : safeNext(nextRaw);

  if (!code && !(tokenHash && type === "recovery")) {
    return NextResponse.redirect(`${url.origin}/reset-password?error=missing_code`);
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.redirect(`${url.origin}/login?error=not_configured`);
  }

  const response = NextResponse.redirect(`${url.origin}${next}`);
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = tokenHash && type === "recovery"
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
    : await supabase.auth.exchangeCodeForSession(code!);
  if (error) {
    return NextResponse.redirect(
      `${url.origin}${recovery ? "/reset-password" : "/login"}?error=invalid_or_expired_link`,
    );
  }

  let marker: string | undefined;
  try { if (recovery && data.user) marker = issueRecoveryMarker(data.user.id); }
  catch { return NextResponse.redirect(`${url.origin}/reset-password?error=recovery_configuration`); }
  if (marker) response.cookies.set("medintel-recovery", marker, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600,
  });
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
