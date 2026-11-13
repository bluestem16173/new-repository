import Image from "next/image";
import Link from "next/link";
import type { ScientificCategory } from "@/domain/scientific-categories/registry";
import { cn } from "@/lib/utils";

interface ScientificCategoryRowProps {
  category: ScientificCategory;
  className?: string;
  ctaLabel?: string;
}

export function ScientificCategoryRow({
  category,
  className,
  ctaLabel,
}: ScientificCategoryRowProps) {
  const label =
    ctaLabel ??
    (category.fieldMedicalTa
      ? "Open Field Medical view →"
      : "View specialty overview →");

  return (
    <Link
      href={category.href}
      className={cn(
        "group grid grid-cols-1 items-center gap-5 border-b border-[#E5E7EB] py-7 outline-none transition-colors last:border-b-0 sm:grid-cols-[112px_1fr] sm:gap-8",
        "hover:bg-[#FAFBFC] focus-visible:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="relative mx-auto size-[112px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white sm:mx-0">
        <Image
          src={category.imageSrc}
          alt={category.imageAlt}
          width={112}
          height={112}
          unoptimized
          className="size-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 space-y-2 pr-2">
        <h3 className="text-lg font-semibold tracking-tight text-[#17212B] group-hover:text-[#2563EB]">
          {category.title}
        </h3>
        <p className="max-w-2xl text-[15px] leading-[1.65] text-[#17212B]/70">
          {category.description}
        </p>
        <p className="text-sm font-medium text-[#2563EB] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {label}
        </p>
      </div>
    </Link>
  );
}
