"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { requestMagicLinkAction } from "@/app/actions/auth";

type Mode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signError) {
          setError(signError.message);
          return;
        }
        router.replace(nextPath);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    });
  }

  function onMagicSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await requestMagicLinkAction(email);
      if (!result.ok) {
        setError(result.error ?? "Could not send magic link");
        return;
      }
      setInfo(
        "If this email is provisioned, a magic link was sent. Check your inbox.",
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg border border-[#E5E7EB] p-1">
        <button
          type="button"
          className={`h-9 flex-1 rounded-md text-sm font-medium ${
            mode === "password"
              ? "bg-[#2563EB] text-white"
              : "text-[#17212B]/70"
          }`}
          onClick={() => setMode("password")}
        >
          Email & password
        </button>
        <button
          type="button"
          className={`h-9 flex-1 rounded-md text-sm font-medium ${
            mode === "magic" ? "bg-[#2563EB] text-white" : "text-[#17212B]/70"
          }`}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>

      <form
        onSubmit={mode === "password" ? onPasswordSubmit : onMagicSubmit}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#17212B]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm"
          />
        </div>

        {mode === "password" ? (
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#17212B]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm"
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-emerald-800" role="status">
            {info}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          {pending
            ? mode === "password"
              ? "Signing in…"
              : "Sending link…"
            : mode === "password"
              ? "Sign in"
              : "Send magic link"}
        </button>
      </form>
    </div>
  );
}

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  if (value.startsWith("/login") || value.startsWith("/auth")) {
    return "/dashboard";
  }
  return value;
}
