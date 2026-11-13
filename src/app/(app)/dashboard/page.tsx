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
import { ScientificCategoryRow } from "@/components/scientific/scientific-category-row";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { TherapeuticAreasExplorer } from "@/components/scientific/therapeutic-areas-explorer";
import { Button } from "@/components/ui/button";
import {
  listAdditionalTherapeuticAreas,
  listCoreTherapeuticAreas,
  listScientificSpecialties,
} from "@/domain/scientific-categories/registry";
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
  const coreAreas = listCoreTherapeuticAreas();
  const additionalAreas = listAdditionalTherapeuticAreas();
  const specialties = listScientificSpecialties();

  return renderAppPage(
    "MedIntel",
    <div className="mx-auto w-full max-w-[1440px] space-y-12 bg-white">
      <header className="space-y-6 border-b border-[#E5E7EB] pb-8">
        <div className="space-y-3">
          <h2 className="text-[2rem] font-semibold tracking-tight text-[#10243A] sm:text-[2.25rem]">
            MedIntel
          </h2>
          <p className="max-w-3xl text-lg font-medium leading-snug text-[#17212B]">
            Clinical Intelligence, Scientific Evidence &amp; Medical Affairs
            Excellence
          </p>
          <p className="max-w-2xl text-[16px] leading-[1.65] text-[#17212B]/70">
            Converting complex scientific information into timely, accurate,
            auditable decisions.
          </p>
        </div>
        <nav
          aria-label="Primary MedIntel workspaces"
          className="flex flex-wrap gap-2"
        >
          <Button
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            render={<Link href="/field-medical" />}
            role="link"
          >
            Field Medical Excellence
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB] text-[#17212B]"
            render={<Link href="/medical-information" />}
            role="link"
          >
            Medical Information
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB] text-[#17212B]"
            render={<Link href="/agents" />}
            role="link"
          >
            AI Agent Center
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB] text-[#17212B]"
            render={<Link href="/evidence" />}
            role="link"
          >
            Evidence Library
          </Button>
        </nav>
      </header>

      {mode === "demo" ? (
        <div
          className="rounded-[12px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="status"
        >
          {DEMO_MODE_NOTICE}
        </div>
      ) : null}

      <ScientificSection
        title="Explore Therapeutic Areas"
        description="Select a therapeutic area to open the Field Medical filtered workspace when available, or an informative overview for planned expansions."
      >
        <TherapeuticAreasExplorer
          core={coreAreas}
          additional={additionalAreas}
        />
      </ScientificSection>

      <ScientificSection
        title="Scientific Specialties"
        description="Cross-cutting scientific dimensions that can tag evidence alongside therapeutic areas without duplicating records."
      >
        <div>
          {specialties.map((specialty) => (
            <ScientificCategoryRow
              key={specialty.slug}
              category={specialty}
              ctaLabel="Open specialty overview →"
            />
          ))}
        </div>
      </ScientificSection>

      <ScientificSection
        title="Medical Information operations"
        description="Live application metrics from the inquiry workspace. Values are calculated from current demo or connected data — not invented marketing stats."
        action={
          <Button
            className="shrink-0 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            render={<Link href="/medical-information/inquiries/new" />}
            role="link"
          >
            New Medical Inquiry
          </Button>
        }
      >
        <div className="space-y-8 pt-2">
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
        </div>
      </ScientificSection>
    </div>,
  );
}
