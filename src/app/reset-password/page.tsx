import { readRecoveryMarker } from "@/lib/auth/recovery";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AccountForm } from "@/components/auth/account-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function RecoveryGate({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const recoveryId = readRecoveryMarker((await cookies()).get("medintel-recovery")?.value);
  const client = await createSupabaseServerClient();
  const result = client && recoveryId ? await client.auth.getUser() : null;
  if (params.error || !recoveryId || !result?.data.user || result.data.user.id !== recoveryId) {
    return <div className="space-y-4"><p role="alert" className="text-sm text-red-700">This password reset link is missing, expired, invalid, or already used. Request a new link and open it in the same browser.</p><a href="/forgot-password" className="text-blue-600 underline">Request another reset link</a><p><a href="/login" className="text-blue-600 underline">Back to Sign In</a></p></div>;
  }
  return <AccountForm view="reset" />;
}
export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-12"><div className="space-y-2"><p className="text-sm font-semibold text-[#2563EB]">MedIntel</p><h1 className="text-2xl font-semibold tracking-tight text-[#17212B]">Choose a new password</h1><p className="text-sm text-slate-600">Use a strong password you have not used before.</p></div><Suspense fallback={<p>Verifying your recovery session…</p>}><RecoveryGate searchParams={searchParams} /></Suspense></main>;
}
