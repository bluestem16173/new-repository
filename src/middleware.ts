import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login", "/auth", "/favicon.ico", "/robots.txt"];

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

/**
 * Edge gate: when Supabase is configured, require an authenticated session.
 * Demo mode (missing public env) remains open for portfolio walkthrough.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const config = getSupabasePublicConfig();

  if (!config) {
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
