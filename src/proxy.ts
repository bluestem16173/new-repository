import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isDemoSurfacePath } from "@/lib/auth/demo-surfaces";
import {
  getRuntimeMode,
  getSupabasePublicConfig,
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login", "/auth", "/favicon.ico", "/robots.txt", "/register", "/forgot-password", "/reset-password", "/onboarding", "/change-password"];

function isPublicPath(pathname: string): boolean {
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return true;
  }
  if (pathname.startsWith("/_next")) {
    return true;
  }
  if (pathname.startsWith("/agents/") && pathname.endsWith(".png")) {
    return true;
  }
  if (pathname.startsWith("/therapeutic-areas/")) {
    return true;
  }
  return false;
}

function missingSupabasePublicEnvNames(): string[] {
  const missing: string[] = [];
  if (!getSupabaseUrl()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!getSupabasePublishableKey()) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return missing;
}

function authConfigUnavailableResponse(missing: string[]): NextResponse {
  const missingList =
    missing.length > 0
      ? missing.map((name) => `<li><code>${name}</code></li>`).join("")
      : "<li><code>NEXT_PUBLIC_SUPABASE_URL</code> and a publishable/anon key</li>";
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authentication configuration unavailable</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #17212b; line-height: 1.5; }
    code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; }
    .note { margin-top: 1.25rem; padding: 0.85rem 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Authentication configuration is unavailable</h1>
  <p>Contact your administrator. This hosted deployment is missing required public Supabase environment variables:</p>
  <ul>${missingList}</ul>
  <p>Set them for <strong>Preview</strong> and <strong>Production</strong> in the Vercel project, then redeploy. Never commit secret values.</p>
  <div class="note" role="note">
    <strong>Illustrative demo surfaces:</strong> when both public Supabase variables are unset,
    <code>/workflow-studio</code>, <code>/data-room</code>, and <code>/agents</code> remain
    available in demo-read mode (Demo labels retained). Other application routes stay closed
    until Auth is configured.
  </div>
</body>
</html>`;

  return new NextResponse(body, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Edge gate: when Supabase is configured, require an authenticated session.
 * Local demo (missing public env, non-production) remains open for portfolio walkthrough.
 * Hosted production/preview without public env fails closed, except illustrative demo surfaces.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const config = getSupabasePublicConfig();

  if (!config) {
    const mode = getRuntimeMode();
    // Fully absent public env + demo surfaces: allow illustrative demo-read only.
    // Does not open dashboard/MI/FM/etc., and does not bypass Auth when Supabase is configured.
    if (mode === "demo" && isDemoSurfacePath(pathname)) {
      const response = NextResponse.next();
      applySecurityHeaders(response);
      response.headers.set("x-medintel-runtime-mode", "demo");
      response.headers.set("x-medintel-demo-read", "studio-surfaces");
      return response;
    }
    if (mode === "supabase" || process.env.NODE_ENV === "production") {
      return authConfigUnavailableResponse(missingSupabasePublicEnvNames());
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    response.headers.set("x-medintel-runtime-mode", "demo");
    return response;
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirect);
    return redirect;
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  const { data: membership } = profile?.organization_id
    ? await supabase.from("organization_memberships").select("id").eq("profile_id", user.id).eq("organization_id", profile.organization_id).maybeSingle()
    : { data: null };
  if (!membership) {
    // Pending-org accounts may still open illustrative demo surfaces after Auth.
    if (isDemoSurfacePath(pathname)) {
      applySecurityHeaders(response);
      response.headers.set("x-medintel-runtime-mode", "supabase");
      response.headers.set("x-medintel-org-status", "pending");
      return response;
    }
    const target = new URL("/onboarding", request.url);
    const pending = NextResponse.redirect(target);
    response.cookies.getAll().forEach(cookie => pending.cookies.set(cookie));
    applySecurityHeaders(pending);
    return pending;
  }
  applySecurityHeaders(response);
  response.headers.set("x-medintel-runtime-mode", "supabase");
  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
