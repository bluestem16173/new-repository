import Link from "next/link";
import { Suspense } from "react";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { FieldMedicalFilters } from "@/components/field-medical/fm-filters";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { renderAppPage } from "@/lib/page";
import {
  getBottleneckAnalytics,
  getCompetencyMatrix,
  getFieldMedicalDashboard,
  parseFmFilters,
} from "@/services/field-medical/analytics";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FieldMedicalAnalyticsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const [kpis, bottlenecks, matrix] = await Promise.all([
    getFieldMedicalDashboard(filters),
    getBottleneckAnalytics(filters),
    getCompetencyMatrix(filters.therapeuticArea),
  ]);

  const maxBacklog = Math.max(
    ...bottlenecks.directorBacklog.map((d) => d.overdue),
    1,
  );

  return renderAppPage(
    "FM Analytics",
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#10243A]">
            Bottleneck intelligence & analytics
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-[#10243A]/65">
            Deterministic rule findings with thresholds, sample sizes, and
            drill-downs. Comparisons are observational — correlation is not
            causation.
          </p>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900">{FM_DEMO_NOTICE}</p>
      <Suspense fallback={null}>
        <FieldMedicalFilters />
      </Suspense>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">
              Readiness duration by therapeutic area
            </CardTitle>
            <CardDescription>
              Median days for approvals in selected period (n = cohort)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottlenecks.readinessByTa.map((row) => {
              const width =
                row.medianDays === null
                  ? 0
                  : Math.min(100, (row.medianDays / 180) * 100);
              return (
                <div key={row.therapeuticArea} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#10243A]">
                      {row.label}
                    </span>
                    <span className="tabular-nums text-[#10243A]/70">
                      {row.medianDays === null ? "N/A" : `${row.medianDays}d`} ·
                      n={row.cohort}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F6FA]">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">
              Coaching backlog by director
            </CardTitle>
            <CardDescription>Overdue open activities as of demo reference date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottlenecks.directorBacklog.map((row) => (
              <div key={row.directorId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#10243A]">
                    {row.directorName}
                  </span>
                  <span className="tabular-nums">{row.overdue}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F3F6FA]">
                  <div
                    className="h-full rounded-full bg-[#0F9D92]"
                    style={{
                      width: `${(row.overdue / maxBacklog) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Competency attainment snapshot</CardTitle>
          <CardDescription>
            {matrix.aggregate.numerator}/{matrix.aggregate.denominator} pairs ·
            rate{" "}
            {matrix.aggregate.rate === null ? "N/A" : `${matrix.aggregate.rate}%`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[#10243A]/75">
          Heatmap detail lives on the{" "}
          <Link
            href="/field-medical/competencies"
            className="font-medium text-[#2563EB] hover:underline"
          >
            competency matrix
          </Link>
          . On-time coaching{" "}
          {kpis.onTimeCoaching.value === null
            ? "N/A"
            : `${kpis.onTimeCoaching.value}%`}{" "}
          with {kpis.onTimeCoaching.overdueCount} overdue in period.
        </CardContent>
      </Card>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Bottleneck findings</CardTitle>
          <CardDescription>
            Unstable flags appear when sample size &lt; 8
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bottlenecks.findings.length === 0 ? (
            <p className="text-sm text-[#10243A]/60">
              No bottleneck rules triggered for the current filter.
            </p>
          ) : (
            bottlenecks.findings.map((finding) => (
              <article
                key={finding.ruleId}
                className="rounded-[12px] border border-[#10243A]/8 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{finding.ruleId}</Badge>
                  <Badge
                    className={
                      finding.severity === "high"
                        ? "bg-rose-100 text-rose-900"
                        : finding.severity === "medium"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-800"
                    }
                  >
                    {finding.severity}
                  </Badge>
                  {finding.unstable ? (
                    <Badge variant="outline">unstable sample</Badge>
                  ) : null}
                </div>
                <h3 className="mt-2 text-base font-semibold text-[#10243A]">
                  {finding.title}
                </h3>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#10243A]/55">Threshold</dt>
                    <dd>{finding.threshold}</dd>
                  </div>
                  <div>
                    <dt className="text-[#10243A]/55">Measured</dt>
                    <dd>{finding.measuredValue}</dd>
                  </div>
                  <div>
                    <dt className="text-[#10243A]/55">Baseline / comparator</dt>
                    <dd>{finding.baseline}</dd>
                  </div>
                  <div>
                    <dt className="text-[#10243A]/55">Population / n</dt>
                    <dd>
                      {finding.population} · n={finding.sampleSize}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm text-[#10243A]/75">
                  {finding.suggestedInvestigation}
                </p>
                <Link
                  href={`/field-medical/msls?attention=1${filters.therapeuticArea !== "all" ? `&ta=${filters.therapeuticArea}` : ""}`}
                  className="mt-3 inline-flex text-sm font-medium text-[#2563EB] hover:underline"
                >
                  Open filtered drill-down
                </Link>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>,
  );
}
