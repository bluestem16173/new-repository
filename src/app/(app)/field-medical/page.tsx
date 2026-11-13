import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  FlaskConical,
  Timer,
  UserRoundCheck,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { FieldMedicalFilters } from "@/components/field-medical/fm-filters";
import { ScientificSection } from "@/components/scientific/scientific-section";
import {
  THERAPEUTIC_AREA_ROWS,
  TherapeuticAreaRow,
} from "@/components/scientific/therapeutic-area-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { SI_EVIDENCE_NOTICE } from "@/lib/demo/scientific-evidence-seed";
import { renderAppPage } from "@/lib/page";
import {
  getFieldMedicalDashboard,
  parseFmFilters,
} from "@/services/field-medical/analytics";
import { listSimulationScenarios } from "@/services/scientific/simulations";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function FieldMedicalDashboardPageContent({
  searchParams,
}: PageProps) {
  await connection();
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const [kpis, scenarios] = await Promise.all([
    getFieldMedicalDashboard(filters),
    listSimulationScenarios(
      filters.therapeuticArea === "all" ? undefined : filters.therapeuticArea,
    ),
  ]);
  const taQuery =
    filters.therapeuticArea === "all" ? "" : `?ta=${filters.therapeuticArea}`;
  const selectedLabel =
    filters.therapeuticArea === "all"
      ? null
      : THERAPEUTIC_AREA_LABELS[filters.therapeuticArea];

  return renderAppPage(
    "Field Medical",
    <div className="mx-auto w-full max-w-[1100px] space-y-12 bg-white px-1 py-2">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
              Field Medical Excellence
            </h2>
            <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
              Workforce readiness, scientific competency, and continuous
              capability development across therapeutic areas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-[#E5E7EB] text-[#17212B]"
              render={<Link href={`/field-medical/simulations${taQuery}`} />}
            >
              Simulations
            </Button>
            <Button
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              render={<Link href={`/field-medical/msls${taQuery}`} />}
            >
              Open MSL roster
            </Button>
          </div>
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

      <ScientificSection
        title="Therapeutic areas"
        description="Select a therapeutic area to filter MSL profiles, competency requirements, simulations, and operational metrics. Entire rows are keyboard-focusable."
      >
        <div className="border-t border-[#E5E7EB]">
          {THERAPEUTIC_AREA_ROWS.map((area) => (
            <TherapeuticAreaRow key={area.id} area={area} />
          ))}
        </div>
      </ScientificSection>

      {selectedLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-sm">
          <p className="text-[#17212B]">
            Filtered to <span className="font-semibold">{selectedLabel}</span>
          </p>
          <Link
            href="/field-medical"
            className="font-medium text-[#2563EB] hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      <Suspense
        fallback={
          <p className="text-sm text-[#17212B]/60">Loading filters…</p>
        }
      >
        <FieldMedicalFilters />
      </Suspense>

      <ScientificSection
        title="Operational KPIs"
        description="Derived from synthetic source records for the selected population. Denominators shown on each card."
      >
        <section
          aria-label="Field Medical KPIs"
          className="grid gap-4 sm:grid-cols-2"
        >
          <Link
            href={`/field-medical/msls${taQuery ? `${taQuery}&` : "?"}readiness=approved`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <MetricCard
              title="Median Time to Readiness"
              value={
                kpis.medianTimeToReadiness.value === null
                  ? "N/A"
                  : `${kpis.medianTimeToReadiness.value}d`
              }
              description={`Approved cohort n=${kpis.medianTimeToReadiness.approvedCohortCount}. Open onboarding n=${kpis.medianTimeToReadiness.openOnboardingCount}.`}
              icon={<Timer className="size-4" />}
              className="border border-[#E5E7EB] shadow-none ring-0"
            />
          </Link>
          <Link
            href={`/field-medical/competencies${taQuery}`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <MetricCard
              title="Competency Attainment Rate"
              value={
                kpis.competencyAttainment.value === null
                  ? "N/A"
                  : `${kpis.competencyAttainment.value}%`
              }
              description={`${kpis.competencyAttainment.numerator}/${kpis.competencyAttainment.denominator} required pairs.`}
              icon={<ClipboardCheck className="size-4" />}
              className="border border-[#E5E7EB] shadow-none ring-0"
            />
          </Link>
          <Link
            href={`/field-medical/coaching${taQuery}`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <MetricCard
              title="On-Time Coaching Completion"
              value={
                kpis.onTimeCoaching.value === null
                  ? "N/A"
                  : `${kpis.onTimeCoaching.value}%`
              }
              description={`On-time ${kpis.onTimeCoaching.onTimeCount}/${kpis.onTimeCoaching.dueCount}. Overdue ${kpis.onTimeCoaching.overdueCount}.`}
              icon={<UserRoundCheck className="size-4" />}
              className="border border-[#E5E7EB] shadow-none ring-0"
            />
          </Link>
          <Link
            href={`/field-medical/msls${taQuery ? `${taQuery}&` : "?"}attention=1`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <MetricCard
              title="MSLs Requiring Attention"
              value={kpis.mslsRequiringAttention.value}
              description={`Distinct MSLs with issues / ${kpis.mslsRequiringAttention.population} in filter.`}
              icon={<AlertTriangle className="size-4" />}
              className="border border-[#E5E7EB] shadow-none ring-0"
            />
          </Link>
        </section>
      </ScientificSection>

      <ScientificSection
        title="Scientific exchange simulations"
        description="Interactive teaching scenarios grounded in allowlisted synthetic passages. AI HCP turns must not invent study facts; provisional scores require reviewer validation."
        action={
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href={`/field-medical/simulations${taQuery}`} />}
          >
            View all
          </Button>
        }
      >
        <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
          {scenarios.length === 0 ? (
            <p className="py-8 text-[15px] text-[#17212B]/65">
              No simulations for this therapeutic area filter.
            </p>
          ) : (
            scenarios.slice(0, 4).map((scenario) => (
              <Link
                key={scenario.id}
                href={`/field-medical/simulations/${scenario.id}`}
                className="flex items-start gap-4 py-5 outline-none transition-colors hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
              >
                <div className="mt-0.5 flex size-10 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8FAFC] text-[#2563EB]">
                  <FlaskConical className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-[#17212B]">{scenario.title}</p>
                  <p className="text-[14px] leading-relaxed text-[#17212B]/65">
                    {scenario.hcpPersona}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-[#17212B]/45">
                    {scenario.category.replaceAll("_", " ")} · rubric{" "}
                    {scenario.rubricVersion}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScientificSection>

      <Card className="border border-[#E5E7EB] shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-base text-[#17212B]">
            Metric definitions
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed">
            Documented numerator/denominator logic — no fabricated trends or
            causal productivity claims.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-[1.65] text-[#17212B]/75">
          <p>{kpis.medianTimeToReadiness.definition.definition}</p>
          <p>{kpis.competencyAttainment.definition.definition}</p>
          <p>{kpis.onTimeCoaching.definition.definition}</p>
        </CardContent>
      </Card>
    </div>,
  );
}

export default function FieldMedicalDashboardPage(props: PageProps) {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><FieldMedicalDashboardPageContent {...props} /></Suspense>;
}
