import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import {
  AssignActivityForm,
  CompleteActivityButton,
} from "@/components/field-medical/coaching-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { renderAppPage } from "@/lib/page";
import { loadFieldMedicalStore } from "@/services/field-medical/store";
import { defaultAnalyticsFilters } from "@/domain/field-medical/metrics";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { store } = await loadFieldMedicalStore();
  const plan = store.coachingPlans.find((p) => p.id === id);
  if (!plan) notFound();

  const msl = store.msls.find((m) => m.id === plan.mslId);
  const activities = store.coachingActivities
    .filter((a) => a.planId === plan.id)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const asOf = Date.parse(defaultAnalyticsFilters().asOf);
  const audits = store.auditEvents.filter(
    (e) =>
      e.entityId === plan.id ||
      activities.some((a) => a.id === e.entityId),
  );

  return renderAppPage(
    plan.title,
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#10243A]">{plan.title}</h2>
            <p className="mt-1 text-sm text-[#10243A]/65">
              {msl ? (
                <Link
                  href={`/field-medical/msls/${msl.id}`}
                  className="text-[#2563EB] hover:underline"
                >
                  {msl.fullName}
                </Link>
              ) : (
                plan.mslId
              )}{" "}
              · {plan.status}
            </p>
          </div>
          <Button variant="outline" render={<Link href="/field-medical/coaching" />}>
            Back
          </Button>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900">{FM_DEMO_NOTICE}</p>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Objective</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-[#10243A]/80">
          {plan.objective}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((activity) => {
              const overdue =
                activity.status !== "completed" &&
                activity.status !== "cancelled" &&
                Date.parse(activity.dueAt) < asOf;
              return (
                <div
                  key={activity.id}
                  className="rounded-lg border border-[#10243A]/8 px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-xs text-[#10243A]/55">
                        Due {new Date(activity.dueAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activity.status}</Badge>
                      {overdue ? (
                        <Badge className="bg-amber-100 text-amber-900">
                          overdue
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {activity.outcomeNotes ? (
                    <p className="mt-2 text-[#10243A]/75">
                      {activity.outcomeNotes}
                    </p>
                  ) : null}
                  {activity.status !== "completed" &&
                  activity.status !== "cancelled" ? (
                    <div className="mt-3">
                      <CompleteActivityButton activityId={activity.id} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
          <CardHeader>
            <CardTitle className="text-base">Assign activity</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignActivityForm planId={plan.id} />
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium">Audit events</p>
              {audits.length === 0 ? (
                <p className="text-sm text-[#10243A]/60">None yet.</p>
              ) : (
                audits.slice(0, 8).map((event) => (
                  <p key={event.id} className="text-xs text-[#10243A]/70">
                    {event.action} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>,
  );
}
