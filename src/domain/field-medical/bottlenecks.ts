import {
  calculateAttentionIssues,
  calculateCompetencyAttainment,
  calculateMedianTimeToReadiness,
  calculateOnTimeCoachingCompletion,
  firstActiveApprovalByMsl,
  filterMslsByTherapeuticArea,
} from "@/domain/field-medical/metrics";
import type {
  AnalyticsFilters,
  Assessment,
  BottleneckFinding,
  CoachingActivity,
  CoachingPlan,
  CompetencyRequirement,
  MslProfile,
  ReadinessDecision,
} from "@/domain/field-medical/types";

export const BOTTLENECK_THRESHOLDS = {
  extendedOnboardingDays: 120,
  lowAttainmentRatePercent: 70,
  overdueCoachingSharePercent: 25,
  validationDelayDays: 21,
  repeatedFailureCount: 2,
  minSampleForStableCompare: 8,
} as const;

export function evaluateBottlenecks(input: {
  msls: MslProfile[];
  requirements: CompetencyRequirement[];
  assessments: Assessment[];
  activities: CoachingActivity[];
  plans: CoachingPlan[];
  decisions: ReadinessDecision[];
  filters: AnalyticsFilters;
}): BottleneckFinding[] {
  const { msls, requirements, assessments, activities, plans, decisions, filters } =
    input;
  const findings: BottleneckFinding[] = [];
  const population = filterMslsByTherapeuticArea(
    msls,
    filters.therapeuticArea,
  ).filter((m) => m.isActive);

  const readiness = calculateMedianTimeToReadiness(msls, decisions, filters);
  const openExtended = calculateAttentionIssues({
    msls,
    requirements,
    assessments,
    activities,
    plans,
    decisions,
    filters,
  }).filter((i) => i.category === "extended_onboarding");

  if (openExtended.length > 0) {
    findings.push({
      ruleId: "FM-BN-001",
      title: "Extended onboarding without readiness approval",
      threshold: `≥ ${BOTTLENECK_THRESHOLDS.extendedOnboardingDays} days open`,
      measuredValue: `${openExtended.length} MSLs`,
      baseline: `Open onboarding median age ${readiness.openOnboardingMedianAgeDays ?? "N/A"} days`,
      population: `${population.length} active MSLs in filter`,
      sampleSize: openExtended.length,
      severity: openExtended.some((i) => i.severity === "high")
        ? "high"
        : "medium",
      suggestedInvestigation:
        "Review onboarding blockers, assessment backlog, and director capacity for affected MSLs.",
      affectedRecordIds: [...new Set(openExtended.map((i) => i.mslId))],
      unstable:
        openExtended.length < BOTTLENECK_THRESHOLDS.minSampleForStableCompare,
    });
  }

  const attainment = calculateCompetencyAttainment(
    msls,
    requirements,
    assessments,
    filters,
  );
  if (
    attainment.rate !== null &&
    attainment.denominator >= BOTTLENECK_THRESHOLDS.minSampleForStableCompare &&
    attainment.rate < BOTTLENECK_THRESHOLDS.lowAttainmentRatePercent
  ) {
    findings.push({
      ruleId: "FM-BN-002",
      title: "Low competency attainment",
      threshold: `< ${BOTTLENECK_THRESHOLDS.lowAttainmentRatePercent}%`,
      measuredValue: `${attainment.rate}% (${attainment.numerator}/${attainment.denominator})`,
      baseline: "Internal target threshold (configurable)",
      population: `${population.length} active MSLs`,
      sampleSize: attainment.denominator,
      severity: attainment.rate < 55 ? "high" : "medium",
      suggestedInvestigation:
        "Inspect missing required competencies by therapeutic area and rubric version changes.",
      affectedRecordIds: population.map((m) => m.id),
      unstable: false,
    });
  }

  const coaching = calculateOnTimeCoachingCompletion(
    activities,
    plans,
    msls,
    filters,
  );
  if (coaching.dueCount > 0) {
    const overdueShare = (coaching.overdueCount / coaching.dueCount) * 100;
    if (overdueShare >= BOTTLENECK_THRESHOLDS.overdueCoachingSharePercent) {
      findings.push({
        ruleId: "FM-BN-003",
        title: "Elevated overdue coaching backlog",
        threshold: `≥ ${BOTTLENECK_THRESHOLDS.overdueCoachingSharePercent}% overdue among due activities`,
        measuredValue: `${Math.round(overdueShare * 10) / 10}% (${coaching.overdueCount}/${coaching.dueCount})`,
        baseline: `On-time rate ${coaching.onTimeRate ?? "N/A"}%`,
        population: "Coaching activities due in selected period",
        sampleSize: coaching.dueCount,
        severity: overdueShare >= 40 ? "high" : "medium",
        suggestedInvestigation:
          "Filter coaching by director and due date; confirm capacity and prioritization.",
        affectedRecordIds: coaching.activityIds,
        unstable:
          coaching.dueCount < BOTTLENECK_THRESHOLDS.minSampleForStableCompare,
      });
    }
  }

  const pending = assessments.filter(
    (a) => a.validationStatus === "pending_review",
  );
  const delayedPending = pending.filter((a) => {
    const ageDays =
      (Date.parse(filters.asOf) - Date.parse(a.assessedAt)) /
      (1000 * 60 * 60 * 24);
    return ageDays >= BOTTLENECK_THRESHOLDS.validationDelayDays;
  });
  if (delayedPending.length > 0) {
    findings.push({
      ruleId: "FM-BN-004",
      title: "Assessment validation delays",
      threshold: `Pending review ≥ ${BOTTLENECK_THRESHOLDS.validationDelayDays} days`,
      measuredValue: `${delayedPending.length} assessments`,
      baseline: `${pending.length} total pending`,
      population: "Assessments awaiting reviewer validation",
      sampleSize: delayedPending.length,
      severity: delayedPending.length >= 15 ? "high" : "medium",
      suggestedInvestigation:
        "Queue pending reviews by age and therapeutic area; assign backup reviewers.",
      affectedRecordIds: delayedPending.map((a) => a.id),
      unstable:
        delayedPending.length < BOTTLENECK_THRESHOLDS.minSampleForStableCompare,
    });
  }

  const failuresByPair = new Map<string, number>();
  for (const assessment of assessments) {
    if (
      assessment.validationStatus === "validated" &&
      !assessment.passed
    ) {
      const key = `${assessment.mslId}::${assessment.competencyId}`;
      failuresByPair.set(key, (failuresByPair.get(key) ?? 0) + 1);
    }
  }
  const repeated = [...failuresByPair.entries()].filter(
    ([, count]) => count >= BOTTLENECK_THRESHOLDS.repeatedFailureCount,
  );
  if (repeated.length > 0) {
    findings.push({
      ruleId: "FM-BN-005",
      title: "Repeated validated assessment failures",
      threshold: `≥ ${BOTTLENECK_THRESHOLDS.repeatedFailureCount} validated failures per MSL–competency`,
      measuredValue: `${repeated.length} pairs`,
      baseline: "Failure recurrence indicator (not causal)",
      population: "Validated failing assessments",
      sampleSize: repeated.length,
      severity: "high",
      suggestedInvestigation:
        "Link coaching plans to failing competencies and schedule reassessment; do not infer coaching effectiveness from score deltas alone.",
      affectedRecordIds: repeated.map(([key]) => key.split("::")[0]),
      unstable:
        repeated.length < BOTTLENECK_THRESHOLDS.minSampleForStableCompare,
    });
  }

  // Post-coaching comparison: later validated assessment after completed coaching —
  // observational only; never claim causation.
  const planById = new Map(plans.map((p) => [p.id, p]));
  let improved = 0;
  let compared = 0;
  const comparedMsls: string[] = [];
  for (const activity of activities) {
    if (activity.status !== "completed" || !activity.completedAt) continue;
    const plan = planById.get(activity.planId);
    if (!plan?.focusCompetencyId) continue;
    if (!population.some((m) => m.id === plan.mslId)) continue;
    const before = assessments
      .filter(
        (a) =>
          a.mslId === plan.mslId &&
          a.competencyId === plan.focusCompetencyId &&
          Date.parse(a.assessedAt) < Date.parse(activity.completedAt!),
      )
      .sort((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt))[0];
    const after = assessments
      .filter(
        (a) =>
          a.mslId === plan.mslId &&
          a.competencyId === plan.focusCompetencyId &&
          a.validationStatus === "validated" &&
          Date.parse(a.assessedAt) > Date.parse(activity.completedAt!),
      )
      .sort((a, b) => Date.parse(a.assessedAt) - Date.parse(b.assessedAt))[0];
    if (!before || !after) continue;
    compared += 1;
    comparedMsls.push(plan.mslId);
    if (after.score > before.score) improved += 1;
  }

  if (compared > 0) {
    const share = Math.round((improved / compared) * 1000) / 10;
    findings.push({
      ruleId: "FM-BN-006",
      title: "Post-coaching assessment score comparison (observational)",
      threshold: "Informational — not a causal claim",
      measuredValue: `${share}% of paired comparisons show higher later score (${improved}/${compared})`,
      baseline:
        "Later score increases can occur for many reasons unrelated to coaching",
      population: "Completed coaching activities with before/after assessments",
      sampleSize: compared,
      severity: "low",
      suggestedInvestigation:
        "Use paired reviews qualitatively; do not report coaching ROI from this comparison alone.",
      affectedRecordIds: [...new Set(comparedMsls)],
      unstable: compared < BOTTLENECK_THRESHOLDS.minSampleForStableCompare,
    });
  }

  void firstActiveApprovalByMsl;
  return findings;
}
