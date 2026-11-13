import Link from "next/link";
import { KnowledgeSubnav } from "@/components/knowledge/knowledge-subnav";
import { RoiScenarioControls } from "@/components/knowledge/roi-scenario-controls";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { renderAppPage } from "@/lib/page";
import { getKnowledgeAnalytics } from "@/services/knowledge/analytics";

function formatRate(value: number | null): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

export default async function KnowledgeAnalyticsPage() {
  const analytics = getKnowledgeAnalytics();
  const { kpis } = analytics;

  return renderAppPage(
    "Knowledge Analytics",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          Knowledge reuse &amp; operational value
        </h2>
        <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
          {analytics.notice}
        </p>
        <KnowledgeSubnav />
      </header>

      <section
        aria-label="Knowledge KPIs"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[
          {
            title: "Total scientific inquiries",
            value: String(kpis.totalScientificInquiries.value),
            note: kpis.totalScientificInquiries.definition,
          },
          {
            title: "Eligible approved matches",
            value: String(kpis.inquiriesWithEligibleApprovedMatches.value),
            note: kpis.inquiriesWithEligibleApprovedMatches.definition,
          },
          {
            title: "Validated reuse events",
            value: String(kpis.validatedKnowledgeReuseEvents.value),
            note: kpis.validatedKnowledgeReuseEvents.definition,
          },
          {
            title: "Eligible reuse rate",
            value: formatRate(kpis.eligibleReuseRate.value),
            note: kpis.eligibleReuseRate.definition,
          },
          {
            title: "Median search + verification",
            value:
              kpis.medianSearchAndVerificationMs.value == null
                ? "N/A"
                : `${Math.round(kpis.medianSearchAndVerificationMs.value / 1000)}s`,
            note: kpis.medianSearchAndVerificationMs.definition,
          },
          {
            title: "Items needing re-review",
            value: String(kpis.knowledgeItemsNeedingRereview.value),
            note: kpis.knowledgeItemsNeedingRereview.definition,
          },
          {
            title: "Net research hours recovered",
            value: kpis.estimatedNetResearchHoursRecovered.value.toFixed(1),
            note: `${kpis.estimatedNetResearchHoursRecovered.label}: ${kpis.estimatedNetResearchHoursRecovered.definition}`,
          },
          {
            title: "Equivalent labor capacity value",
            value: `$${kpis.equivalentLaborCapacityValue.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            note: `${kpis.equivalentLaborCapacityValue.label}: ${kpis.equivalentLaborCapacityValue.definition}`,
          },
          {
            title: "Actual realized cash savings",
            value: "N/A",
            note: kpis.actualRealizedCashSavings.definition,
          },
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-[#E5E7EB] p-4"
          >
            <h3 className="text-[13px] font-medium text-[#17212B]/55">
              {card.title}
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17212B]">
              {card.value}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#17212B]/55">
              {card.note}
            </p>
          </article>
        ))}
      </section>

      <RoiScenarioControls initial={analytics.assumptions} />

      <ScientificSection
        title="Repeated scientific question themes"
        description="Approved knowledge items with reuse event counts from persisted records."
      >
        <ul className="space-y-2">
          {kpis.repeatedScientificQuestionThemes.value.map((theme) => (
            <li key={theme.knowledgeItemId}>
              <Link
                href={`/knowledge/items/${theme.knowledgeItemId}`}
                className="flex flex-col gap-1 rounded-lg border border-[#E5E7EB] px-4 py-3 outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-[14px] font-medium text-[#17212B]">
                  {theme.title}
                </span>
                <span className="text-[13px] text-[#17212B]/55">
                  {theme.therapeuticArea} · {theme.reuseCount} reuse event
                  {theme.reuseCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ScientificSection>

      <ScientificSection
        title="Bottleneck intelligence"
        description="Findings link to underlying queues. Correlations are not causation."
      >
        <div className="grid gap-3">
          {analytics.bottlenecks.map((finding) => (
            <Link
              key={finding.id}
              href={finding.href}
              className="rounded-xl border border-[#E5E7EB] p-4 outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-[#17212B]">
                  {finding.title}
                </h3>
                <p className="text-lg font-semibold text-[#17212B]">
                  {finding.measuredValue}
                </p>
              </div>
              <p className="mt-2 text-[13px] text-[#17212B]/65">
                {finding.comparison} · n={finding.sampleSize}
              </p>
              <p className="mt-1 text-[13px] text-[#17212B]/55">
                Suggested investigation: {finding.suggestedInvestigation}
              </p>
            </Link>
          ))}
        </div>
      </ScientificSection>
    </div>,
  );
}
