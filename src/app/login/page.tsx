import Link from "next/link";
import { getRuntimeMode } from "@/lib/supabase/env";

export default function LoginPage() {
  const mode = getRuntimeMode();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#17212B]">
          MedIntel sign-in
        </h1>
        <p className="text-[15px] leading-relaxed text-[#17212B]/70">
          Protected routes require a Supabase Auth session when the project is
          configured. Demo mode uses synthetic identities without recruiter API
          keys.
        </p>
      </div>
      {mode === "demo" ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950"
          role="status"
        >
          Runtime is in <strong>demo</strong> mode. Continue to the dashboard
          for the synthetic portfolio walkthrough.
        </div>
      ) : (
        <div
          className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/75"
          role="status"
        >
          Supabase Auth is configured. Use your organization identity provider
          or email magic link as provisioned by an administrator. SSO wiring is
          prepared architecturally and not fully implemented in this build.
        </div>
      )}
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
      >
        Continue to MedIntel
      </Link>
    </main>
  );
}
