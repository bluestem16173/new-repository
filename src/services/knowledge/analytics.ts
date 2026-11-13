import { calculateScenarioCapacity } from "@/domain/knowledge/schemas";
import { getKnowledgeStore } from "@/lib/demo/knowledge-seed";
import { listKnowledgeItems } from "@/services/knowledge/items";
import { listReuseEvents } from "@/services/knowledge/reuse";

/**
 * Leadership metrics from persisted demo records.
 * Search hits ≠ validated reuse. Assumed savings labeled Scenario Estimate.
 */
export function getKnowledgeAnalytics() {
  const store = getKnowledgeStore();
  const approved = listKnowledgeItems({ status: "approved" });
  const pending = listKnowledgeItems({
    status: "pending_review",
    includeNonApproved: true,
  });
  const needsRereview = listKnowledgeItems({
    status: "needs_rereview",
    includeNonApproved: true,
  });
  const reuse = listReuseEvents();
  const validatedReuse = reuse.filter((event) =>
    ["accepted", "adapted"].includes(event.decision),
  );
  const searches = store.searchEvents;

  const inquiriesWithEligibleMatches = new Set(
    store.matches
      .filter((match) => match.applicability === "approved_for_reuse")
      .map((match) => match.inquiryId ?? match.id),
  ).size;

  const totalScientificInquiries =
    searches.length > 0 ? searches.length : inquiriesWithEligibleMatches;

  const eligibleReuseRate =
    totalScientificInquiries > 0
      ? validatedReuse.length / totalScientificInquiries
      : null;

  const verificationSamples = validatedReuse
    .map((event) => event.verificationDurationMs)
    .filter((value): value is number => typeof value === "number");
  const searchSamples = searches
    .map((event) => event.durationMs)
    .filter((value): value is number => typeof value === "number");

  const median = (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  const medianSearchMs = median(searchSamples);
  const medianVerificationMs = median(verificationSamples);

  const observedNetMinutes = validatedReuse
    .map((event) => {
      if (
        event.searchDurationMs == null ||
        event.verificationDurationMs == null
      ) {
        return null;
      }
      // Observed effort only — baseline comparison deferred to scenario model
      return (event.searchDurationMs + event.verificationDurationMs) / 60000;
    })
    .filter((value): value is number => value !== null);

  const assumptions = store.assumptions;
  const scenario = calculateScenarioCapacity({
    mslWorkforceSize: assumptions.mslWorkforceSize,
    monthlyResearchInquiriesPerMsl: assumptions.monthlyResearchInquiriesPerMsl,
    eligibleReusePercentage: assumptions.eligibleReusePercentage,
    netMinutesSavedPerReuse: assumptions.netMinutesSavedPerReuse,
    loadedHourlyLaborCost: assumptions.loadedHourlyLaborCost,
  });

  const themes = approved.map((item) => ({
    knowledgeItemId: item.id,
    title: item.title,
    therapeuticArea: item.therapeuticArea,
    reuseCount: reuse.filter((event) => event.knowledgeItemId === item.id)
      .length,
  }));

  const bottlenecks = [
    {
      id: "pending-review-queue",
      title: "Knowledge items awaiting approval",
      measuredValue: pending.length,
      comparison: "Count of pending_review items",
      sampleSize: pending.length,
      suggestedInvestigation:
        "Open the knowledge review queue and inspect aging drafts.",
      href: "/knowledge/review",
    },
    {
      id: "low-reuse-despite-approved",
      title: "Approved items with zero validated reuse",
      measuredValue: approved.filter(
        (item) =>
          !validatedReuse.some((event) => event.knowledgeItemId === item.id),
      ).length,
      comparison: "Approved items vs accepted/adapted reuse events",
      sampleSize: approved.length,
      suggestedInvestigation:
        "Check match ranking, applicability warnings, and MSL awareness.",
      href: "/knowledge/search",
    },
    {
      id: "needs-rereview",
      title: "Knowledge items needing re-review",
      measuredValue: needsRereview.length,
      comparison: "needs_rereview status count",
      sampleSize: needsRereview.length,
      suggestedInvestigation:
        "Review outdated evidence links and currency flags.",
      href: "/knowledge/review",
    },
  ];

  return {
    notice:
      "Metrics are calculated from persisted Scientific Knowledge Network records in this environment. Demo mode uses synthetic in-memory events.",
    kpis: {
      totalScientificInquiries: {
        value: totalScientificInquiries,
        definition:
          "Knowledge search events recorded (proxy for scientific inquiries entering the matcher). Not Medical Information case totals unless joined.",
      },
      inquiriesWithEligibleApprovedMatches: {
        value: inquiriesWithEligibleMatches,
        definition:
          "Distinct match records (or linked inquiries) marked approved_for_reuse.",
      },
      validatedKnowledgeReuseEvents: {
        value: validatedReuse.length,
        definition: "Reuse events with decision accepted or adapted.",
      },
      eligibleReuseRate: {
        value: eligibleReuseRate,
        definition:
          "Validated reuse events / scientific inquiry search events. Null when denominator is 0.",
      },
      medianSearchAndVerificationMs: {
        value:
          medianSearchMs != null && medianVerificationMs != null
            ? medianSearchMs + medianVerificationMs
            : null,
        definition:
          "Median search duration + median verification duration from recorded events (ms). Null if samples missing.",
        searchSampleSize: searchSamples.length,
        verificationSampleSize: verificationSamples.length,
      },
      estimatedNetResearchHoursRecovered: {
        value: scenario.monthlyNetHoursRecovered,
        label: "Scenario Estimate",
        definition: scenario.formula,
      },
      equivalentLaborCapacityValue: {
        value: scenario.monthlyEquivalentCapacityValue,
        label: "Scenario Estimate",
        definition:
          "Scenario monthly net hours × loaded hourly labor cost. Capacity value ≠ cash savings.",
      },
      actualRealizedCashSavings: {
        value: null as number | null,
        label: "N/A",
        definition:
          "Cash savings shown only when independently documented. No cash evidence in demo.",
      },
      repeatedScientificQuestionThemes: {
        value: themes,
        definition: "Approved knowledge items with reuse event counts.",
      },
      knowledgeItemsNeedingRereview: {
        value: needsRereview.length,
        definition: "Items in needs_rereview status.",
      },
    },
    observedReuseEffortMinutesSample: {
      values: observedNetMinutes,
      note: "Observed search+verification minutes for validated reuse events — not baseline-subtracted savings.",
    },
    assumptions,
    scenario,
    bottlenecks,
  };
}
