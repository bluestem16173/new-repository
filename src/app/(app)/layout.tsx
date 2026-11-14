import type { ReactNode } from "react";

/**
 * Shared data for app routes. Individual pages compose AppShell with titles.
 * Do not read cookies/session here — that blocks static prerender when
 * Supabase env is configured. Pages resolve the user inside their own trees.
 */
export default function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
