import type { ReactNode } from "react";
import type { User } from "@/domain/types";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: ReactNode;
  title: string;
  user: User;
  runtimeMode: "demo" | "supabase";
}

export function AppShell({
  children,
  title,
  user,
  runtimeMode,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.005_210)]">
      <Sidebar className="hidden lg:flex" role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DisclaimerBanner />
        <Header title={title} user={user} runtimeMode={runtimeMode} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
