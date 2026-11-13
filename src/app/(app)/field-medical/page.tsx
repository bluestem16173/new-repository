import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Timer,
  UserRoundCheck,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { FieldMedicalFilters } from "@/components/field-medical/fm-filters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { renderAppPage } from "@/lib/page";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import {
  getFieldMedicalDashboard,
  parseFmFilters,
} from "@/services/field-medical/analytics";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FieldMedicalDashboardPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const kpis = await getFieldMedicalDashboard(filters);
  const taQuery =
    filters.therapeuticArea === "all" ? "" : `?ta=${filters.therapeuticArea}`;

  return renderAppPage(
    "Field Medical",
    <div className="mx-auto w-full max-w-[1440px] space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#10243A]">
              Field Medical Excellence
            </h2>
            <p className="max-w-3xl text-base leading-relaxed text-[#10243A]/65">
              Workforce readiness, scientific competency, and continuous
              capability development.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#10243A]/15"
            render={<Link href={`/field-medical/msls${taQuery}`} />}
          >
            Open MSL roster
          </Button>
        </div>
        <FieldMedicalSubnav />
      </header>

      <div
        className="rounded-[12px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
        role="status"
      >
        {FM_DEMO_NOTICE} All KPIs below are derived from the deterministic
        synthetic seed (N shown per metric).
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
        <FieldMedicalFilters />
      </Suspense>

      <section
        aria-label="Field Medical KPIs"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Link
          href={`/field-medical/msls${taQuery ? `${taQuery}&` : "?"}readiness=approved`}
          className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <MetricCard
            title="Median Time to Readiness"
            value={
              kpis.medianTimeToReadiness.value === null
                ? "N/A"
                : `${kpis.medianTimeToReadiness.value}d`
            }
            description={`Approved cohort n=${kpis.medianTimeToReadiness.approvedCohortCount}. Open onboarding n=${kpis.medianTimeToReadiness.openOnboardingCount}${kpis.medianTimeToReadiness.openOnboardingMedianAgeDays !== null ? ` (median age ${kpis.medianTimeToReadiness.openOnboardingMedianAgeDays}d)` : ""}.`}
            icon={<Timer className="size-4" />}
          />
        </Link>
        <Link
          href={`/field-medical/competencies${taQuery}`}
          className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <MetricCard
            title="Competency Attainment Rate"
            value={
              kpis.competencyAttainment.value === null
                ? "N/A"
                : `${kpis.competencyAttainment.value}%`
            }
            description={`${kpis.competencyAttainment.numerator}/${kpis.competencyAttainment.denominator} required pairs with current validated passes.`}
            icon={<ClipboardCheck className="size-4" />}
          />
        </Link>
        <Link
          href={`/field-medical/coaching${taQuery}`}
          className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <MetricCard
            title="On-Time Coaching Completion"
            value={
              kpis.onTimeCoaching.value === null
                ? "N/A"
                : `${kpis.onTimeCoaching.value}%`
            }
            description={`On-time ${kpis.onTimeCoaching.onTimeCount}/${kpis.onTimeCoaching.dueCount}. Eventual ${kpis.onTimeCoaching.eventualCompletionCount}. Overdue ${kpis.onTimeCoaching.overdueCount}.`}
            icon={<UserRoundCheck className="size-4" />}
          />
        </Link>
        <Link
          href={`/field-medical/msls${taQuery ? `${taQuery}&` : "?"}attention=1`}
          className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <MetricCard
            title="MSLs Requiring Attention"
            value={kpis.mslsRequiringAttention.value}
            description={`Distinct MSLs with actionable issues out of ${kpis.mslsRequiringAttention.population} in filter.`}
            icon={<AlertTriangle className="size-4" />}
          />
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base text-[#10243A]">
              Metric definitions
            </CardTitle>
            <CardDescription>
              Documented numerator/denominator logic — no fabricated trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-[#10243A]/75">
            <div>
              <p className="font-medium text-[#10243A]">
                {kpis.medianTimeToReadiness.definition.name}
              </p>
              <p>{kpis.medianTimeToReadiness.definition.definition}</p>
            </div>
            <div>
              <p className="font-medium text-[#10243A]">
                {kpis.competencyAttainment.definition.name}
              </p>
              <p>{kpis.competencyAttainment.definition.definition}</p>
            </div>
            <div>
              <p className="font-medium text-[#10243A]">
                {kpis.onTimeCoaching.definition.name}
              </p>
              <p>{kpis.onTimeCoaching.definition.definition}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base text-[#10243A]">
              Attention issue categories
            </CardTitle>
            <CardDescription>
              Deduplicated at MSL level for the KPI; categories listed below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kpis.mslsRequiringAttention.issues.length === 0 ? (
              <p className="text-sm text-[#10243A]/60">No attention issues in filter.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(
                  [
                    "overdue_coaching",
                    "missing_required_competency",
                    "failed_validated_assessment",
                    "extended_onboarding",
                  ] as const
                ).map((category) => {
                  const count = kpis.mslsRequiringAttention.issues.filter(
                    (i) => i.category === category,
                  ).length;
                  return (
                    <li
                      key={category}
                      className="flex items-center justify-between rounded-lg bg-[#F3F6FA] px-3 py-2"
                    >
                      <span className="capitalize text-[#10243A]">
                        {category.replaceAll("_", " ")}
                      </span>
                      <span className="tabular-nums font-medium text-[#10243A]">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button
              className="mt-4"
              variant="outline"
              render={<Link href={`/field-medical/analytics${taQuery}`} />}
            >
              View bottleneck analytics
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>,
  );
}
