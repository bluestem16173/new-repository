import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AccountForm } from "@/components/auth/account-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ChangePasswordGate() {
  await connection();
  const client = await createSupabaseServerClient();
  if (!client) return <p role="alert">Password changes are unavailable until authentication is configured.</p>;
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login?next=/change-password");
  return <AccountForm view="change" />;
}
export default function ChangePasswordPage() {
  return <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-12"><div className="space-y-2"><p className="text-sm font-semibold text-[#2563EB]">MedIntel</p><h1 className="text-2xl font-semibold">Change your password</h1><p className="text-sm text-slate-600">Enter your current password, then choose a new password. You will sign in again after updating it.</p></div><Suspense fallback={<p>Verifying your session…</p>}><ChangePasswordGate /></Suspense></main>;
}
