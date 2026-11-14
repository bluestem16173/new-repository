"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeLegacyRecoveryAction } from "@/app/actions/account";
import { parseLegacyRecoveryFragment } from "@/lib/auth/legacy-recovery";

/** Runs on every route so a hosted Auth redirect to /login retains recovery intent. */
export function RecoveryLinkHandler() {
  const router = useRouter();
  const started = useRef(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const recovery = parseLegacyRecoveryFragment(window.location.hash);
    if (!recovery || started.current) return;
    started.current = true;
    // Remove bearer credentials before network requests, navigation or telemetry.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    startTransition(async () => {
      try {
        const result = await completeLegacyRecoveryAction(recovery);
        router.replace(result.ok ? "/reset-password" : "/reset-password?error=invalid_or_expired_link");
      } catch {
        router.replace("/reset-password?error=invalid_or_expired_link");
      }
      router.refresh();
    });
  }, [router]);
  return pending ? <p role="status" className="border-b border-blue-100 bg-blue-50 px-6 py-3 text-sm text-blue-900">Verifying your password recovery link…</p> : null;
}
