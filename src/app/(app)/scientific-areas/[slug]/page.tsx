import { connection } from "next/server";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Button } from "@/components/ui/button";
import {
  getScientificCategoryBySlug,
  listTherapeuticAreas,
  listScientificSpecialties,
} from "@/domain/scientific-categories/registry";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { renderAppPage } from "@/lib/page";

export async function generateStaticParams() {
  const slugs = [
    ...listTherapeuticAreas(),
    ...listScientificSpecialties(),
  ].map((category) => ({ slug: category.slug }));
  return slugs;
}

async function ScientificAreaDetailPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const category = getScientificCategoryBySlug(slug);
  if (!category) notFound();

  const kindLabel =
    category.kind === "therapeutic_area"
      ? "Therapeutic area"
      : "Scientific specialty";

  const statusLabel =
    category.status === "active"
      ? "Working capabilities available"
      : category.status === "partial"
        ? "Partial capabilities"
        : "Planned expansion";

  return renderAppPage(
    category.title,
    <div className="mx-auto w-full max-w-[960px] space-y-10 bg-white px-1 py-2">
      <header className="space-y-5 border-b border-[#E5E7EB] pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative size-[112px] shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
            <Image
              src={category.imageSrc}
              alt={category.imageAlt}
              width={112}
              height={112}
              unoptimized
              className="size-full object-contain p-2"
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#17212B]/45">
              {kindLabel}
            </p>
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
              {category.title}
            </h2>
            <p className="max-w-2xl text-[16px] leading-[1.65] text-[#17212B]/70">
              {category.description}
            </p>
            <p className="text-[14px] text-[#17212B]/60">{statusLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {category.fieldMedicalTa ? (
            <Button
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              render={<Link href={category.href} />}
              role="link"
            >
              Open Field Medical (
              {THERAPEUTIC_AREA_LABELS[category.fieldMedicalTa]})
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/dashboard" />}
            role="link"
          >
            Back to homepage
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/evidence" />}
            role="link"
          >
            Evidence Library
          </Button>
        </div>
      </header>

      <ScientificSection
        title="Overview"
        description="How this category fits MedIntel Clinical Intelligence and Medical Affairs workflows."
      >
        <div className="space-y-3 text-[15px] leading-[1.65] text-[#17212B]/75">
          <p>
            MedIntel organizes scientific work by therapeutic area and
            scientific specialty so Field Medical, Medical Information, and
            evidence retrieval stay aligned without duplicating records.
          </p>
          {category.fieldMedicalTa ? (
            <p>
              This display category maps to the existing Field Medical filter{" "}
              <span className="font-medium text-[#17212B]">
                {THERAPEUTIC_AREA_LABELS[category.fieldMedicalTa]}
              </span>{" "}
              (
              <code className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[13px]">
                {category.fieldMedicalTa}
              </code>
              ). Stored identifiers are unchanged.
            </p>
          ) : (
            <p>
              Field Medical filters for this category are not yet provisioned.
              Use this page for orientation until roster, competency, and
              simulation content is available.
            </p>
          )}
        </div>
      </ScientificSection>

      <ScientificSection title="Available capabilities">
        {category.availableCapabilities.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/75">
            {category.availableCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] leading-[1.65] text-[#17212B]/70">
            No dedicated workflows are live for this category yet. Platform
            modules below remain available for related Medical Affairs work.
          </p>
        )}
      </ScientificSection>

      <ScientificSection title="Planned capabilities">
        {category.plannedCapabilities.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/75">
            {category.plannedCapabilities.map((item) => (
              <li key={item}>
                <span className="mr-2 inline-block rounded border border-[#E5E7EB] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#17212B]/55">
                  Planned
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] leading-[1.65] text-[#17212B]/70">
            No additional planned items listed for this category.
          </p>
        )}
      </ScientificSection>

      <ScientificSection
        title="Related MedIntel modules"
        description="Working product areas you can use today. These are not simulated counts."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Link
              href="/field-medical"
              className="block rounded-lg border border-[#E5E7EB] px-4 py-3 text-[15px] font-medium text-[#17212B] outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
            >
              Field Medical Excellence
            </Link>
          </li>
          <li>
            <Link
              href="/medical-information"
              className="block rounded-lg border border-[#E5E7EB] px-4 py-3 text-[15px] font-medium text-[#17212B] outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
            >
              Medical Information
            </Link>
          </li>
          <li>
            <Link
              href="/field-medical/simulations"
              className="block rounded-lg border border-[#E5E7EB] px-4 py-3 text-[15px] font-medium text-[#17212B] outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
            >
              MSL / KOL simulations
            </Link>
          </li>
          <li>
            <Link
              href="/evidence"
              className="block rounded-lg border border-[#E5E7EB] px-4 py-3 text-[15px] font-medium text-[#17212B] outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
            >
              Evidence Library
            </Link>
          </li>
        </ul>
      </ScientificSection>
    </div>,
  );
}

export default function ScientificAreaDetailPage(props: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><ScientificAreaDetailPageContent {...props} /></Suspense>;
}
