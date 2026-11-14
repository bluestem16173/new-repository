"use client";

import { AuthCaptcha } from "@/components/auth/captcha";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, registerAccountAction, requestPasswordResetAction, updatePasswordAction } from "@/app/actions/account";
import { changePasswordSchema, registrationSchema, resetPasswordSchema, emailSchema } from "@/lib/auth/validation";

export function AccountForm({ view }: { view: "register" | "forgot" | "reset" | "change" }) {
  const router = useRouter();
  const [captchaToken, setCaptchaToken] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setError(null);
    const parsed = view === "change" ? changePasswordSchema.safeParse(fields) : view === "register" ? registrationSchema.safeParse(fields) : view === "reset" ? resetPasswordSchema.safeParse(fields) : emailSchema.safeParse(fields.email);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your entries."); return; }
    startTransition(async () => {
      try {
        const result = view === "change" ? await changePasswordAction(fields) : view === "register" ? await registerAccountAction(fields, captchaToken) : view === "forgot" ? await requestPasswordResetAction(String(fields.email), captchaToken) : await updatePasswordAction(fields);
        if (!result.ok) { setError(result.error); return; }
        setMessage(result.message);
        if (result.destination) { router.replace(result.destination); router.refresh(); }
      } catch { setError("Request could not be completed. Please try again."); }
    });
  }
  return <div className="space-y-5">
    {message ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm" role="status"><h2 className="mb-2 font-semibold">{view === "register" ? "Check your email" : "Request complete"}</h2>{message}</div> : <form onSubmit={submit} className="space-y-4">
      {view === "register" && <Field name="fullName" label="Full name" autoComplete="name" />}
      {(view === "register" || view === "forgot") && <Field name="email" label="Email address" type="email" autoComplete="email" />}
      {view === "change" && <Field name="currentPassword" label="Current password" type="password" autoComplete="current-password" />}
      {view !== "forgot" && <><Field name="password" label={(view === "reset" || view === "change") ? "New password" : "Password"} type="password" autoComplete="new-password" minLength={12} /><p className="text-xs text-slate-600">Use 12–128 characters. Additional organization password requirements may apply.</p><Field name="confirmPassword" label={(view === "reset" || view === "change") ? "Confirm new password" : "Confirm password"} type="password" autoComplete="new-password" minLength={12} /></>}
      {(view === "register" || view === "forgot") && <AuthCaptcha onToken={setCaptchaToken} />}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button disabled={pending || ((view === "register" || view === "forgot") && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !captchaToken)} className="h-10 w-full rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Please wait…" : view === "register" ? "Create account" : view === "forgot" ? "Send Reset Link" : "Update Password"}</button>
    </form>}
    <nav aria-label="Account navigation" className="flex flex-wrap gap-4 text-sm text-[#2563EB]"><Link href="/login">Back to Sign In</Link><Link href="/register">Create account</Link><Link href="/forgot-password">Forgot password</Link></nav>
  </div>;
}
function Field({ name, label, ...props }: { name: string; label: string; type?: string; autoComplete?: string; minLength?: number }) {
  return <label className="block space-y-1.5 text-sm font-medium" htmlFor={name}><span>{label}</span><input id={name} name={name} required maxLength={name === "fullName" ? 100 : name === "email" ? 254 : 128} className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3" {...props} /></label>;
}
