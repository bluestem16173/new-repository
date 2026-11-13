"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BriefcaseMedical,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/medical-information",
    label: "Medical Information",
    icon: Stethoscope,
  },
  {
    href: "/field-medical",
    label: "Field Medical",
    icon: Users,
  },
  {
    href: "/evidence",
    label: "Evidence Library",
    icon: BookOpen,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[oklch(0.42_0.08_210)] text-white">
          <BriefcaseMedical className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">MedIntel</p>
          <p className="text-[11px] text-muted-foreground">
            Medical Affairs Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-[11px] leading-relaxed text-muted-foreground">
        Modules 1–2 in demo. Synthetic data only. AI responses are not
        auto-released.
      </div>
    </aside>
  );
}
