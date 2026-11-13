import Image from "next/image";
import Link from "next/link";
import type { TherapeuticArea } from "@/domain/field-medical/types";
import { cn } from "@/lib/utils";

export interface TherapeuticAreaContent {
  id: TherapeuticArea;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

interface TherapeuticAreaRowProps {
  area: TherapeuticAreaContent;
  className?: string;
}

export function TherapeuticAreaRow({ area, className }: TherapeuticAreaRowProps) {
  return (
    <Link
      href={area.href}
      className={cn(
        "group grid grid-cols-1 items-center gap-5 border-b border-[#E5E7EB] py-7 outline-none transition-colors last:border-b-0 sm:grid-cols-[112px_1fr] sm:gap-8",
        "hover:bg-[#FAFBFC] focus-visible:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="relative mx-auto size-[112px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white sm:mx-0">
        <Image
          src={area.imageSrc}
          alt={area.imageAlt}
          width={112}
          height={112}
          unoptimized
          className="size-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 space-y-2 pr-2">
        <h3 className="text-lg font-semibold tracking-tight text-[#17212B] group-hover:text-[#2563EB]">
          {area.title}
        </h3>
        <p className="max-w-2xl text-[15px] leading-[1.65] text-[#17212B]/70">
          {area.description}
        </p>
        <p className="text-sm font-medium text-[#2563EB] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Explore workforce &amp; simulations →
        </p>
      </div>
    </Link>
  );
}

export const THERAPEUTIC_AREA_ROWS: TherapeuticAreaContent[] = [
  {
    id: "general_medicine",
    title: "General Medicine",
    description:
      "Obesity, cardiovascular, and metabolic disease scientific exchange — endpoint discipline, absolute versus relative risk framing, and labeled guidance.",
    imageSrc: "/therapeutic-areas/general-medicine.png",
    imageAlt: "Dimensional blue and teal therapeutic antibody illustration",
    href: "/field-medical?ta=general_medicine",
  },
  {
    id: "rare_disease",
    title: "Rare Disease",
    description:
      "Specialized populations, diagnostic complexity, and expert engagement where evidence is sparse and uncertainty must be stated clearly.",
    imageSrc: "/therapeutic-areas/rare-disease.png",
    imageAlt: "Dimensional violet and blue DNA double helix illustration",
    href: "/field-medical?ta=rare_disease",
  },
  {
    id: "inflammation",
    title: "Inflammation",
    description:
      "Evolving treatments, comparative evidence, and long-term disease management with careful safety discussion boundaries.",
    imageSrc: "/therapeutic-areas/immunology.png",
    imageAlt: "Dimensional immune cell with cytokine signaling illustration",
    href: "/field-medical?ta=inflammation",
  },
  {
    id: "oncology",
    title: "Oncology",
    description:
      "Rapid scientific advances, biomarker-selected populations, and complex scientific exchange under high evidence velocity.",
    imageSrc: "/therapeutic-areas/oncology.png",
    imageAlt: "Dimensional purple and blue cancer cell illustration",
    href: "/field-medical?ta=oncology",
  },
];
