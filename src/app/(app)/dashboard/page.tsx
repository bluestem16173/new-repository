import Link from "next/link";
import {
  ClipboardList,
  FileCheck2,
  FolderOpen,
  Timer,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { WorkflowDistribution } from "@/components/dashboard/workflow-distribution";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { RecentInquiries } from "@/components/dashboard/recent-inquiries";
import { Button } from "@/components/ui/button";
import { renderAppPage } from "@/lib/page";
import { getDashboardOverview } from "@/services/inquiries";
import { DEMO_MODE_NOTICE } from "@/lib/demo/seed";
import { getRuntimeMode } from "@/lib/supabase/env";

export default async function DashboardPage() {
  const [overview, mode] = await Promise.all([
    getDashboardOverview(),
    Promise.resolve(getRuntimeMode()),
  ]);

  const showTurnaround = overview.averageReviewTurnaroundDays !== null;

  return renderAppPage(
    "Dashboard",
    <div className="mx-auto w-full max-w-[1440px] space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#10243A] sm:text-[1.75rem]">
            Medical Affairs Overview
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#10243A]/65">
            Monitor medical inquiries, review workflows, and operational
            performance.
          </p>
        </div>
        <Button
          className="shrink-0 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          render={<Link href="/medical-information/inquiries/new" />}
        >
          New Medical Inquiry
        </Button>
      </header>

      {mode === "demo" ? (
        <div
          className="rounded-[12px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="status"
        >
          {DEMO_MODE_NOTICE}
        </div>
      ) : null}

      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Open Inquiries"
          value={overview.openInquiries}
          description="Active Medical Information cases in workflow"
          icon={<FolderOpen className="size-4" />}
        />
        <MetricCard
          title="Pending Medical Review"
          value={overview.pendingMedicalReview}
          description="Awaiting medical reviewer decision"
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          title="Approved Responses"
          value={overview.approvedResponses}
          description="Approved and ready for close-out"
          icon={<FileCheck2 className="size-4" />}
        />
        {showTurnaround ? (
          <MetricCard
            title="Average Review Turnaround"
            value={`${overview.averageReviewTurnaroundDays}d`}
            description={`Based on ${overview.averageReviewTurnaroundSampleSize} approved review${overview.averageReviewTurnaroundSampleSize === 1 ? "" : "s"} with submission timestamps`}
            icon={<Timer className="size-4" />}
          />
        ) : (
          <MetricCard
            title="Needs Revision"
            value={overview.needsRevision}
            description="Returned for specialist updates"
            icon={<ClipboardList className="size-4" />}
          />
        )}
      </section>

      <section
        aria-label="Workflow and attention"
        className="grid gap-4 lg:grid-cols-2"
      >
        <WorkflowDistribution
          items={overview.statusDistribution}
          totalInquiries={overview.totalInquiries}
        />
        <NeedsAttention inquiries={overview.needsAttention} />
      </section>

      <section aria-label="Recent inquiries">
        <RecentInquiries inquiries={overview.recentInquiries} />
      </section>
    </div>,
  );
}
