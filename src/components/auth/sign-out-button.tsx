"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3">
    <a href="/change-password" className="text-xs text-blue-700 hover:underline">Change password</a>
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="rounded-md border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#17212B] hover:bg-[#F8FAFC] disabled:opacity-60"
    >
      {pending ? "…" : "Sign out"}
    </button>
    </div>
  );
}
