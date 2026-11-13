import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";

/**
 * Shared data for app routes. Individual pages compose AppShell with titles.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Warm session resolution early; pages still fetch for their own shell props.
  await getCurrentUser();
  void getRuntimeMode();
  return children;
}
