"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/field-medical", label: "Overview", exact: true },
  { href: "/field-medical/msls", label: "MSL roster" },
  { href: "/field-medical/competencies", label: "Competencies" },
  { href: "/field-medical/coaching", label: "Coaching" },
  { href: "/field-medical/simulations", label: "Simulations" },
  { href: "/field-medical/analytics", label: "Analytics" },
];

export function FieldMedicalSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Field Medical sections"
      className="flex flex-wrap gap-1 border-b border-[#10243A]/10 pb-3"
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
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
              active
                ? "bg-[#2563EB]/10 text-[#2563EB]"
                : "text-[#10243A]/65 hover:bg-[#F3F6FA] hover:text-[#10243A]",
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
