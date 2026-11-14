import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/lib/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

async function PendingAccess() {
  const client = await createSupabaseServerClient();
  if (!client) return <p>Connect Supabase to register and request organization access.</p>;
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const membership = await getCurrentUserOrganization();
  if (!membership.error && membership.organizationId) redirect("/dashboard");
  return (
    <>
      <h1 className="text-2xl font-semibold">Your account is ready. Organization access is pending.</h1>
      <p className="text-slate-600">
        Contact your MedIntel administrator to request an invitation. Registration does not grant access to an existing organization.
      </p>
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950">
        <p>
          While you wait, you can still open <strong>Illustrative Demo</strong> surfaces
          (Auth required; Demo labels retained):
        </p>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-[#2563EB]" aria-label="Demo surfaces">
          <Link href="/workflow-studio" className="hover:underline">Workflow Studio</Link>
          <Link href="/data-room" className="hover:underline">Data Room</Link>
          <Link href="/agents" className="hover:underline">AI Agent Center</Link>
        </nav>
      </div>
      <SignOutButton />
    </>
  );
}
export default function OnboardingPage() {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6"><Suspense fallback={<p>Verifying your account…</p>}><PendingAccess /></Suspense></main>;
}
