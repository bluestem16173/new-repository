import { Suspense } from "react";
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
  return <><h1 className="text-2xl font-semibold">Your account is ready. Organization access is pending.</h1><p className="text-slate-600">Contact your MedIntel administrator to request an invitation. Registration does not grant access to an existing organization.</p><SignOutButton /></>;
}
export default function OnboardingPage() {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6"><Suspense fallback={<p>Verifying your account…</p>}><PendingAccess /></Suspense></main>;
}
