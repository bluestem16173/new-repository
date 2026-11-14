"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/knowledge", label: "Overview", exact: true },
  { href: "/knowledge/search", label: "Search" },
  { href: "/knowledge/review", label: "Review queue" },
  { href: "/knowledge/analytics", label: "Analytics" },
];

export function KnowledgeSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Scientific Knowledge Network sections"
      className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2",
              active
                ? "bg-[#17212B] font-medium text-white"
                : "text-[#17212B]/70 hover:bg-[#F8FAFC] hover:text-[#17212B]",
            )}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
