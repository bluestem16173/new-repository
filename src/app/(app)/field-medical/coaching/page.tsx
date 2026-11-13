import Link from "next/link";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { CreateCoachingPlanForm } from "@/components/field-medical/coaching-forms";
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
import { listCoachingWorkspace } from "@/services/field-medical/analytics";
import { defaultAnalyticsFilters } from "@/domain/field-medical/metrics";

export default async function CoachingPage() {
  const workspace = await listCoachingWorkspace();
  const asOf = Date.parse(defaultAnalyticsFilters().asOf);

  const plans = [...workspace.plans].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );

  return renderAppPage(
    "Coaching",
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#10243A]">
            Coaching workspace
          </h2>
          <p className="mt-1 text-sm text-[#10243A]/65">
            Create plans, assign activities, record completion, and audit
            outcomes. Later score increases are not claimed as causal effects.
          </p>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900">{FM_DEMO_NOTICE}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Create coaching plan</CardTitle>
            <CardDescription>
              Mutations are Zod-validated, authorized, and audited in demo memory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCoachingPlanForm
              mslOptions={workspace.msls.map((m) => ({
                id: m.id,
                label: `${m.fullName} (${m.employeeCode})`,
              }))}
              competencyOptions={workspace.competencies.map((c) => ({
                id: c.id,
                label: `${c.code} · ${c.name}`,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plans.slice(0, 20).map((plan) => {
              const msl = workspace.msls.find((m) => m.id === plan.mslId);
              const activities = workspace.activities.filter(
                (a) => a.planId === plan.id,
              );
              const overdue = activities.filter(
                (a) =>
                  a.status !== "completed" &&
                  a.status !== "cancelled" &&
                  Date.parse(a.dueAt) < asOf,
              ).length;
              return (
                <Link
                  key={plan.id}
                  href={`/field-medical/coaching/${plan.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#10243A]/8 px-3 py-3 hover:bg-[#F3F6FA]"
                >
                  <div>
                    <p className="font-medium text-[#2563EB]">{plan.title}</p>
                    <p className="text-xs text-[#10243A]/60">
                      {msl?.fullName ?? plan.mslId} · {plan.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{activities.length} activities</Badge>
                    {overdue > 0 ? (
                      <Badge className="bg-amber-100 text-amber-900">
                        {overdue} overdue
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>,
  );
}
