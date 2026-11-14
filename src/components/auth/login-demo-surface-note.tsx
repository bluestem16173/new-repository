"use client";

import { useSearchParams } from "next/navigation";
import { isDemoSurfacePath } from "@/lib/auth/demo-surfaces";
import { safeNext } from "@/lib/auth/redirect";

/** Client note when Auth redirects into an Illustrative Demo surface. */
export function LoginDemoSurfaceNote() {
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const pathname = nextPath.split("?")[0] ?? nextPath;
  if (!isDemoSurfacePath(pathname)) return null;

  return (
    <p
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-950"
      role="note"
    >
      You are signing in to open an <strong>Illustrative Demo</strong> surface
      (Workflow Studio, Data Room, or Agents). Demo labels stay visible after
      Auth — content is not for clinical decision-making.
    </p>
  );
}
