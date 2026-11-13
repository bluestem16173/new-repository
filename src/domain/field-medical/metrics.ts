import type {
  AnalyticsFilters,
  Assessment,
  AttentionIssue,
  CoachingActivity,
  CoachingPlan,
  CompetencyRequirement,
  MslProfile,
  ReadinessDecision,
  TherapeuticArea,
} from "@/domain/field-medical/types";

export const FM_REPORTING_TIMEZONE = "America/New_York";
export const FM_DEMO_REFERENCE_AS_OF = "2026-03-15T17:00:00.000Z";
export const FM_DEMO_PERIOD_START = "2025-03-15T04:00:00.000Z"; // America/New_York midnight-ish UTC
export const FM_DEMO_PERIOD_END = "2026-03-16T04:00:00.000Z";

export const METRIC_DEFINITIONS = {
  medianTimeToReadiness: {
    id: "median_time_to_readiness",
    name: "Median Time to Readiness",
    definition:
      "Median calendar days from onboarding_start_date to the first active approved readiness decision for MSLs whose approval falls in the selected period.",
    numeratorLabel: "Approved readiness cohort",
    denominatorLabel: "MSLs with an active approval in period",
  },
  competencyAttainment: {
    id: "competency_attainment_rate",
    name: "Competency Attainment Rate",
    definition:
      "Share of applicable required MSL–competency pairs with a current, reviewer-validated passing assessment as of the reporting date.",
    numeratorLabel: "Validated passing pairs",
    denominatorLabel: "Applicable required pairs",
  },
  onTimeCoaching: {
    id: "on_time_coaching_completion",
    name: "On-Time Coaching Completion Rate",
    definition:
      "Share of coaching activities due in the reporting period that were completed on or before their due timestamp (UTC storage; period boundaries use the reporting timezone).",
    numeratorLabel: "On-time completions",
    denominatorLabel: "Activities due in period",
  },
  mslsRequiringAttention: {
    id: "msls_requiring_attention",
    name: "MSLs Requiring Attention",
    definition:
      "Distinct MSLs with at least one actionable issue: overdue coaching, missing required competencies, failed validated assessments, or extended onboarding.",
    numeratorLabel: "Distinct MSLs with issues",
    denominatorLabel: "Selected MSL population",
  },
} as const;

export function defaultAnalyticsFilters(): AnalyticsFilters {
  return {
    periodStart: FM_DEMO_PERIOD_START,
    periodEnd: FM_DEMO_PERIOD_END,
    therapeuticArea: "all",
    asOf: FM_DEMO_REFERENCE_AS_OF,
    reportingTimeZone: FM_REPORTING_TIMEZONE,
  };
}

export function filterMslsByTherapeuticArea(
  msls: MslProfile[],
  therapeuticArea: TherapeuticArea | "all",
): MslProfile[] {
  if (therapeuticArea === "all") return [...msls];
  return msls.filter((msl) => msl.therapeuticArea === therapeuticArea);
}

function parseDateOnlyUtc(dateOnly: string): number {
  return Date.parse(`${dateOnly}T00:00:00.000Z`);
}

function calendarDaysBetween(startDateOnly: string, endIso: string): number {
  const start = parseDateOnlyUtc(startDateOnly);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return Number.NaN;
  }
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** First active approved decision per MSL (earliest decidedAt wins; duplicates ignored). */
export function firstActiveApprovalByMsl(
  decisions: ReadinessDecision[],
): Map<string, ReadinessDecision> {
  const map = new Map<string, ReadinessDecision>();
  const approved = decisions
    .filter((d) => d.outcome === "approved" && d.isActive)
    .sort(
      (a, b) =>
        Date.parse(a.decidedAt) - Date.parse(b.decidedAt) ||
        a.id.localeCompare(b.id),
    );

  for (const decision of approved) {
    if (!map.has(decision.mslId)) {
      map.set(decision.mslId, decision);
    }
  }
  return map;
}

export interface MedianReadinessResult {
  medianDays: number | null;
  approvedCohortCount: number;
  openOnboardingCount: number;
  openOnboardingMedianAgeDays: number | null;
  sampleIds: string[];
}

export function calculateMedianTimeToReadiness(
  msls: MslProfile[],
  decisions: ReadinessDecision[],
  filters: AnalyticsFilters,
): MedianReadinessResult {
  const population = filterMslsByTherapeuticArea(
    msls,
    filters.therapeuticArea,
  );
  const approvals = firstActiveApprovalByMsl(decisions);
  const periodStart = Date.parse(filters.periodStart);
  const periodEnd = Date.parse(filters.periodEnd);

  const durations: number[] = [];
  const sampleIds: string[] = [];

  for (const msl of population) {
    const approval = approvals.get(msl.id);
    if (!approval) continue;
    const decided = Date.parse(approval.decidedAt);
    if (decided < periodStart || decided >= periodEnd) continue;
    const days = calendarDaysBetween(msl.onboardingStartDate, approval.decidedAt);
    if (Number.isNaN(days)) continue;
    durations.push(days);
    sampleIds.push(msl.id);
  }

  const open: number[] = [];
  for (const msl of population) {
    if (approvals.has(msl.id)) continue;
    const age = calendarDaysBetween(msl.onboardingStartDate, filters.asOf);
    if (!Number.isNaN(age)) open.push(age);
  }

  const med = median(durations);
  return {
    medianDays: med === null ? null : Math.round(med * 10) / 10,
    approvedCohortCount: durations.length,
    openOnboardingCount: open.length,
    openOnboardingMedianAgeDays:
      median(open) === null ? null : Math.round(median(open)! * 10) / 10,
    sampleIds,
  };
}

export function requirementsApplicableAsOf(
  requirements: CompetencyRequirement[],
  therapeuticArea: TherapeuticArea,
  asOfIso: string,
): CompetencyRequirement[] {
  const asOfDay = asOfIso.slice(0, 10);
  return requirements.filter((req) => {
    if (!req.isRequired) return false;
    if (req.therapeuticArea !== therapeuticArea) return false;
    if (req.effectiveFrom > asOfDay) return false;
    if (req.effectiveTo && req.effectiveTo < asOfDay) return false;
    return true;
  });
}

/**
 * Latest assessment per MSL + competency + rubric version, preferring non-superseded.
 * Numerator eligibility: validated + passed + not expired as of asOf.
 */
export function latestAssessmentKey(
  mslId: string,
  competencyId: string,
  rubricVersion: string,
): string {
  return `${mslId}::${competencyId}::${rubricVersion}`;
}

export function selectLatestAssessments(
  assessments: Assessment[],
): Map<string, Assessment> {
  const sorted = [...assessments].sort(
    (a, b) =>
      Date.parse(b.assessedAt) - Date.parse(a.assessedAt) ||
      b.id.localeCompare(a.id),
  );
  const map = new Map<string, Assessment>();
  for (const assessment of sorted) {
    if (assessment.validationStatus === "superseded") continue;
    const key = latestAssessmentKey(
      assessment.mslId,
      assessment.competencyId,
      assessment.rubricVersion,
    );
    if (!map.has(key)) {
      map.set(key, assessment);
    }
  }
  return map;
}

export function isAssessmentValidForAttainment(
  assessment: Assessment,
  asOfIso: string,
): boolean {
  if (assessment.validationStatus !== "validated") return false;
  if (!assessment.passed) return false;
  if (
    assessment.validUntil &&
    Date.parse(assessment.validUntil) < Date.parse(asOfIso)
  ) {
    return false;
  }
  return true;
}

export interface CompetencyAttainmentResult {
  rate: number | null;
  numerator: number;
  denominator: number;
  pairKeys: string[];
}

export function calculateCompetencyAttainment(
  msls: MslProfile[],
  requirements: CompetencyRequirement[],
  assessments: Assessment[],
  filters: AnalyticsFilters,
): CompetencyAttainmentResult {
  const population = filterMslsByTherapeuticArea(
    msls,
    filters.therapeuticArea,
  ).filter((m) => m.isActive);

  const latest = selectLatestAssessments(assessments);
  let numerator = 0;
  let denominator = 0;
  const pairKeys: string[] = [];

  for (const msl of population) {
    const applicable = requirementsApplicableAsOf(
      requirements,
      msl.therapeuticArea,
      filters.asOf,
    );
    for (const req of applicable) {
      denominator += 1;
      const key = latestAssessmentKey(
        msl.id,
        req.competencyId,
        req.rubricVersion,
      );
      pairKeys.push(key);
      const assessment = latest.get(key);
      if (assessment && isAssessmentValidForAttainment(assessment, filters.asOf)) {
        numerator += 1;
      }
    }
  }

  return {
    rate: denominator === 0 ? null : Math.round((numerator / denominator) * 1000) / 10,
    numerator,
    denominator,
    pairKeys,
  };
}

export interface CoachingCompletionResult {
  onTimeRate: number | null;
  onTimeCount: number;
  dueCount: number;
  eventualCompletionCount: number;
  overdueCount: number;
  activityIds: string[];
}

export function calculateOnTimeCoachingCompletion(
  activities: CoachingActivity[],
  plans: CoachingPlan[],
  msls: MslProfile[],
  filters: AnalyticsFilters,
): CoachingCompletionResult {
  const populationIds = new Set(
    filterMslsByTherapeuticArea(msls, filters.therapeuticArea).map((m) => m.id),
  );
  const planById = new Map(plans.map((p) => [p.id, p]));
  const periodStart = Date.parse(filters.periodStart);
  const periodEnd = Date.parse(filters.periodEnd);
  const asOf = Date.parse(filters.asOf);

  const dueInPeriod: CoachingActivity[] = [];
  for (const activity of activities) {
    if (activity.status === "cancelled") continue;
    const plan = planById.get(activity.planId);
    if (!plan || !populationIds.has(plan.mslId)) continue;
    const due = Date.parse(activity.dueAt);
    if (due < periodStart || due >= periodEnd) continue;
    dueInPeriod.push(activity);
  }

  let onTime = 0;
  let eventual = 0;
  let overdue = 0;

  for (const activity of dueInPeriod) {
    const due = Date.parse(activity.dueAt);
    if (activity.status === "completed" && activity.completedAt) {
      eventual += 1;
      if (Date.parse(activity.completedAt) <= due) {
        onTime += 1;
      }
    } else if (due < asOf) {
      overdue += 1;
    }
  }

  return {
    onTimeRate:
      dueInPeriod.length === 0
        ? null
        : Math.round((onTime / dueInPeriod.length) * 1000) / 10,
    onTimeCount: onTime,
    dueCount: dueInPeriod.length,
    eventualCompletionCount: eventual,
    overdueCount: overdue,
    activityIds: dueInPeriod.map((a) => a.id),
  };
}

const EXTENDED_ONBOARDING_DAYS = 120;

export function calculateAttentionIssues(input: {
  msls: MslProfile[];
  requirements: CompetencyRequirement[];
  assessments: Assessment[];
  activities: CoachingActivity[];
  plans: CoachingPlan[];
  decisions: ReadinessDecision[];
  filters: AnalyticsFilters;
}): AttentionIssue[] {
  const {
    msls,
    requirements,
    assessments,
    activities,
    plans,
    decisions,
    filters,
  } = input;
  const population = filterMslsByTherapeuticArea(
    msls,
    filters.therapeuticArea,
  ).filter((m) => m.isActive);
  const approvals = firstActiveApprovalByMsl(decisions);
  const latest = selectLatestAssessments(assessments);
  const planById = new Map(plans.map((p) => [p.id, p]));
  const asOf = Date.parse(filters.asOf);
  const issues: AttentionIssue[] = [];

  for (const msl of population) {
    if (!approvals.has(msl.id)) {
      const age = calendarDaysBetween(msl.onboardingStartDate, filters.asOf);
      if (!Number.isNaN(age) && age >= EXTENDED_ONBOARDING_DAYS) {
        issues.push({
          mslId: msl.id,
          category: "extended_onboarding",
          severity: age >= 180 ? "high" : "medium",
          detail: `Onboarding open for ${age} days without approved readiness`,
        });
      }
    }

    const applicable = requirementsApplicableAsOf(
      requirements,
      msl.therapeuticArea,
      filters.asOf,
    );
    for (const req of applicable) {
      const key = latestAssessmentKey(
        msl.id,
        req.competencyId,
        req.rubricVersion,
      );
      const assessment = latest.get(key);
      if (!assessment || !isAssessmentValidForAttainment(assessment, filters.asOf)) {
        issues.push({
          mslId: msl.id,
          category: "missing_required_competency",
          severity: "high",
          detail: `Missing validated pass for competency ${req.competencyId} (${req.rubricVersion})`,
        });
      }
      if (
        assessment &&
        assessment.validationStatus === "validated" &&
        !assessment.passed
      ) {
        issues.push({
          mslId: msl.id,
          category: "failed_validated_assessment",
          severity: "high",
          detail: `Validated failing score ${assessment.score} on ${req.rubricVersion}`,
        });
      }
    }
  }

  for (const activity of activities) {
    if (activity.status === "cancelled" || activity.status === "completed") {
      continue;
    }
    const due = Date.parse(activity.dueAt);
    if (due >= asOf) continue;
    const plan = planById.get(activity.planId);
    if (!plan) continue;
    if (!population.some((m) => m.id === plan.mslId)) continue;
    issues.push({
      mslId: plan.mslId,
      category: "overdue_coaching",
      severity: "medium",
      detail: `Overdue coaching activity ${activity.id}`,
    });
  }

  return issues;
}

export function distinctMslsRequiringAttention(
  issues: AttentionIssue[],
): string[] {
  return [...new Set(issues.map((i) => i.mslId))].sort();
}

export function readinessDisplayStatus(
  msl: MslProfile,
  decisions: ReadinessDecision[],
  attainmentComplete: boolean,
): import("@/domain/field-medical/types").ReadinessDisplayStatus {
  const mslDecisions = decisions
    .filter((d) => d.mslId === msl.id && d.isActive)
    .sort((a, b) => Date.parse(b.decidedAt) - Date.parse(a.decidedAt));

  const latest = mslDecisions[0];
  if (latest?.outcome === "approved") return "approved";
  if (latest?.outcome === "deferred") return "deferred";
  if (latest?.outcome === "denied") return "denied";
  if (attainmentComplete) return "eligible";
  const age = calendarDaysBetween(msl.onboardingStartDate, FM_DEMO_REFERENCE_AS_OF);
  if (!Number.isNaN(age) && age <= 7) return "not_started";
  return "in_progress";
}
