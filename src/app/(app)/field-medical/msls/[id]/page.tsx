import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { ReadinessDecisionForm } from "@/components/field-medical/readiness-form";
import { Badge } from "@/components/ui/badge";
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
import { renderAppPage } from "@/lib/page";
import { getMslDetail } from "@/services/field-medical/analytics";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function MslDetailPageContent({ params }: PageProps) {
  await connection();
  const { id } = await params;
  const detail = await getMslDetail(id);
  if (!detail) notFound();

  const { msl, director, eligibility } = detail;

  return renderAppPage(
    msl.fullName,
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#10243A]">
              {msl.fullName}
            </h2>
            <p className="mt-1 text-sm text-[#10243A]/65">
              {msl.employeeCode} ·{" "}
              {THERAPEUTIC_AREA_LABELS[msl.therapeuticArea]} ·{" "}
              {director?.fullName ?? "Unassigned director"}
            </p>
          </div>
          <Button variant="outline" render={<Link href="/field-medical/msls" />}>
            Back to roster
          </Button>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900">{FM_DEMO_NOTICE}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile & onboarding</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[#10243A]/55">Onboarding start</p>
              <p className="font-medium">{msl.onboardingStartDate}</p>
            </div>
            <div>
              <p className="text-[#10243A]/55">Readiness status</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {detail.readinessStatus.replaceAll("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-[#10243A]/55">Region</p>
              <p className="font-medium">{msl.region}</p>
            </div>
            <div>
              <p className="text-[#10243A]/55">Email</p>
              <p className="font-medium">{msl.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Readiness eligibility</CardTitle>
            <CardDescription>
              Policy: required competencies attained with validated assessments;
              no blocking gaps; authorized approver; recorded decision. Eligibility
              ≠ approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessDecisionForm
              mslId={msl.id}
              eligible={eligibility.requiredCompetenciesMet}
              alreadyApproved={eligibility.hasActiveApproval}
              blockingMissing={eligibility.blockingMissing}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Competency requirements</CardTitle>
          <CardDescription>
            {eligibility.attainedCount}/{eligibility.requiredCount} attained with
            current validated passes
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y bg-[#F3F6FA] text-[#10243A]/65">
              <tr>
                <th className="px-3 py-2 font-medium">Competency</th>
                <th className="px-3 py-2 font-medium">Rubric</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {detail.competencies.map((row) => (
                <tr key={row.requirement.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.competency.name}</p>
                    <p className="text-xs text-[#10243A]/55">
                      {row.competency.code}
                    </p>
                  </td>
                  <td className="px-3 py-2">{row.requirement.rubricVersion}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">
                      {row.attained
                        ? "Attained"
                        : row.assessment?.validationStatus ?? "Missing"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.assessment?.score ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Assessment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {detail.assessments.slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-lg border border-[#10243A]/8 px-3 py-2">
                <p className="font-medium">
                  Score {a.score} · {a.validationStatus} · rubric {a.rubricVersion}
                </p>
                <p className="text-xs text-[#10243A]/55">
                  {new Date(a.assessedAt).toLocaleString()} · evidence{" "}
                  {a.evidenceReference ?? "n/a"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Coaching & simulations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {detail.plans.length === 0 ? (
              <p className="text-[#10243A]/60">No coaching plans.</p>
            ) : (
              detail.plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/field-medical/coaching/${plan.id}`}
                  className="block rounded-lg border border-[#10243A]/8 px-3 py-2 hover:bg-[#F3F6FA]"
                >
                  <p className="font-medium text-[#2563EB]">{plan.title}</p>
                  <p className="text-xs text-[#10243A]/55">
                    {plan.status} · {plan.objective}
                  </p>
                </Link>
              ))
            )}
            <div className="pt-2">
              <p className="mb-2 font-medium">Simulation attempts</p>
              {detail.attempts.length === 0 ? (
                <p className="text-[#10243A]/60">None recorded.</p>
              ) : (
                detail.attempts.slice(0, 5).map((attempt) => (
                  <p key={attempt.id} className="text-[#10243A]/75">
                    {new Date(attempt.attemptedAt).toLocaleDateString()} · score{" "}
                    {attempt.score} · {attempt.passed ? "pass" : "fail"}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Audit timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.auditEvents.length === 0 ? (
            <p className="text-sm text-[#10243A]/60">No audit events.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {detail.auditEvents.slice(0, 12).map((event) => (
                <li key={event.id} className="border-l-2 border-[#2563EB]/30 pl-3">
                  <p className="font-medium">{event.action}</p>
                  <p className="text-xs text-[#10243A]/55">
                    {new Date(event.createdAt).toLocaleString()}
                    {event.actorName ? ` · ${event.actorName}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>,
  );
}

export default function MslDetailPage(props: PageProps) {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><MslDetailPageContent {...props} /></Suspense>;
}
