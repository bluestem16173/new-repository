import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SIMULATION_CATEGORY_LABELS,
  type SimulationCategory,
} from "@/domain/scientific/types";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { SI_EVIDENCE_NOTICE } from "@/lib/demo/scientific-evidence-seed";
import { renderAppPage } from "@/lib/page";
import { parseFmFilters } from "@/services/field-medical/analytics";
import { listSimulationScenarios } from "@/services/scientific/simulations";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SimulationsIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const scenarios = await listSimulationScenarios(
    filters.therapeuticArea === "all" ? undefined : filters.therapeuticArea,
  );
  const selectedLabel =
    filters.therapeuticArea === "all"
      ? null
      : THERAPEUTIC_AREA_LABELS[filters.therapeuticArea];

  return renderAppPage(
    "Simulations",
    <div className="mx-auto w-full max-w-[1100px] space-y-10 bg-white px-1 py-2">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
              MSL scientific exchange simulations
            </h2>
            <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
              Interactive teaching scenarios across five competency categories.
              AI plays a fictional HCP; study facts must come from allowlisted
              teaching passages only.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/field-medical" />}
          >
            Back to overview
          </Button>
        </div>
        <FieldMedicalSubnav />
      </header>

      <div
        className="space-y-2 border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/80"
        role="status"
      >
        <p>{FM_DEMO_NOTICE}</p>
        <p>{SI_EVIDENCE_NOTICE}</p>
      </div>

      {selectedLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-sm">
          <p className="text-[#17212B]">
            Filtered to <span className="font-semibold">{selectedLabel}</span>
          </p>
          <Link
            href="/field-medical/simulations"
            className="font-medium text-[#2563EB] hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      <ScientificSection
        title="Scenario catalog"
        description="Each scenario includes a fictional HCP persona, clinical context, learning objectives, verified (allowlisted) teaching documents, and a rubric version."
      >
        <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
          {scenarios.length === 0 ? (
            <p className="py-10 text-[15px] text-[#17212B]/65">
              No scenarios match this therapeutic area filter.
            </p>
          ) : (
            scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/field-medical/simulations/${scenario.id}`}
                className="flex items-start gap-4 py-6 outline-none transition-colors hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
              >
                <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8FAFC] text-[#2563EB]">
                  <FlaskConical className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#17212B]">
                      {scenario.title}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {
                        SIMULATION_CATEGORY_LABELS[
                          scenario.category as SimulationCategory
                        ]
                      }
                    </Badge>
                  </div>
                  <p className="text-[15px] leading-[1.65] text-[#17212B]/70">
                    {scenario.hcpPersona}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-[#17212B]/45">
                    {scenario.code} ·{" "}
                    {THERAPEUTIC_AREA_LABELS[scenario.therapeuticArea]} · rubric{" "}
                    {scenario.rubricVersion} · scenario v
                    {scenario.scenarioVersion}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScientificSection>
    </div>,
  );
}
