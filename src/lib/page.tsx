import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";

export async function renderAppPage(
  title: string,
  children: ReactNode,
) {
  const [user, runtimeMode] = await Promise.all([
    getCurrentUser(),
    Promise.resolve(getRuntimeMode()),
  ]);

  return (
    <AppShell title={title} user={user} runtimeMode={runtimeMode}>
      {children}
    </AppShell>
  );
}
