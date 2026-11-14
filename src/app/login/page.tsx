import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getRuntimeMode } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function LoginGate({ children }: { children: React.ReactNode }) {
  const mode = getRuntimeMode();
  if (mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (user) {
      redirect("/onboarding");
    }
  }
  return children;
}

export default function LoginPage() {
  const mode = getRuntimeMode();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#17212B]">
          Sign in to MedIntel
        </h1>
        <p className="text-[15px] leading-relaxed text-[#17212B]/70">
          Medical Affairs workspaces require an authenticated Supabase session
          when the project is connected.
        </p>
      </div>

      <nav className="flex gap-4 text-sm text-[#2563EB]" aria-label="Account options"><a href="/register">Create account</a><a href="/forgot-password">Forgot password</a></nav>

      <Suspense
        fallback={
          <p className="text-sm text-[#17212B]/60">Loading sign-in…</p>
        }
      >
        <LoginGate>
          {mode === "demo" && process.env.NODE_ENV === "production" ? <p role="status" className="text-sm text-amber-900">Authentication is unavailable until Supabase is configured. Contact your administrator.</p> : mode === "demo" ? (
            <div
              className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950"
              role="status"
            >
              <p>
                Runtime is in <strong>demo</strong> mode (Supabase public env
                not configured). In-memory synthetic data is available without
                Auth.
              </p>
              <a
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
              >
                Open demo dashboard
              </a>
            </div>
          ) : (
            <>
              <LoginForm />
              <p className="mt-4 text-xs leading-relaxed text-[#17212B]/55">
                Interactive recruiter demo access is not enabled on this build.
                Use a provisioned account. Magic link requires Supabase Auth
                email delivery to be configured in the project dashboard.
              </p>
            </>
          )}
        </LoginGate>
      </Suspense>
    </main>
  );
}
