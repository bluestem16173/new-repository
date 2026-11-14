import {
  calculateAttentionIssues,
  calculateCompetencyAttainment,
  calculateMedianTimeToReadiness,
  calculateOnTimeCoachingCompletion,
  defaultAnalyticsFilters,
  distinctMslsRequiringAttention,
  METRIC_DEFINITIONS,
  readinessDisplayStatus,
  requirementsApplicableAsOf,
  selectLatestAssessments,
  isAssessmentValidForAttainment,
  latestAssessmentKey,
  firstActiveApprovalByMsl,
  filterMslsByTherapeuticArea,
} from "@/domain/field-medical/metrics";
import { evaluateBottlenecks } from "@/domain/field-medical/bottlenecks";
import type {
  AnalyticsFilters,
  AttentionIssue,
  BottleneckFinding,
  MslProfile,
  TherapeuticArea,
} from "@/domain/field-medical/types";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { loadFieldMedicalStore } from "@/services/field-medical/store";

export interface DashboardKpis {
  filters: AnalyticsFilters;
  medianTimeToReadiness: {
    value: number | null;
    unit: "days";
    approvedCohortCount: number;
    openOnboardingCount: number;
    openOnboardingMedianAgeDays: number | null;
    definition: (typeof METRIC_DEFINITIONS)["medianTimeToReadiness"];
    sampleIds: string[];
  };
  competencyAttainment: {
    value: number | null;
    unit: "percent";
    numerator: number;
    denominator: number;
    definition: (typeof METRIC_DEFINITIONS)["competencyAttainment"];
  };
  onTimeCoaching: {
    value: number | null;
    unit: "percent";
    onTimeCount: number;
    dueCount: number;
    eventualCompletionCount: number;
    overdueCount: number;
    definition: (typeof METRIC_DEFINITIONS)["onTimeCoaching"];
  };
  mslsRequiringAttention: {
    value: number;
    population: number;
    issues: AttentionIssue[];
    distinctMslIds: string[];
    definition: (typeof METRIC_DEFINITIONS)["mslsRequiringAttention"];
  };
  synthetic: true;
}

export function parseFmFilters(
  searchParams: Record<string, string | string[] | undefined>,
): AnalyticsFilters {
  const base = defaultAnalyticsFilters();
  const ta = typeof searchParams.ta === "string" ? searchParams.ta : "all";
  const therapeuticArea =
    ta === "all" ||
    ta === "oncology" ||
    ta === "inflammation" ||
    ta === "rare_disease" ||
    ta === "general_medicine"
      ? ta
      : "all";

  return {
    ...base,
    therapeuticArea,
    periodStart:
      typeof searchParams.from === "string" && searchParams.from
        ? searchParams.from
        : base.periodStart,
    periodEnd:
      typeof searchParams.to === "string" && searchParams.to
        ? searchParams.to
        : base.periodEnd,
  };
}

export async function getFieldMedicalDashboard(
  filters: AnalyticsFilters = defaultAnalyticsFilters(),
): Promise<DashboardKpis> {
  const { store } = await loadFieldMedicalStore();
  const readiness = calculateMedianTimeToReadiness(
    store.msls,
    store.readinessDecisions,
    filters,
  );
  const attainment = calculateCompetencyAttainment(
    store.msls,
    store.requirements,
    store.assessments,
    filters,
  );
  const coaching = calculateOnTimeCoachingCompletion(
    store.coachingActivities,
    store.coachingPlans,
    store.msls,
    filters,
  );
  const issues = calculateAttentionIssues({
    msls: store.msls,
    requirements: store.requirements,
    assessments: store.assessments,
    activities: store.coachingActivities,
    plans: store.coachingPlans,
    decisions: store.readinessDecisions,
    filters,
  });
  const distinct = distinctMslsRequiringAttention(issues);
  const population = filterMslsByTherapeuticArea(
    store.msls,
    filters.therapeuticArea,
  ).filter((m) => m.isActive);

  return {
    filters,
    medianTimeToReadiness: {
      value: readiness.medianDays,
      unit: "days",
      approvedCohortCount: readiness.approvedCohortCount,
      openOnboardingCount: readiness.openOnboardingCount,
      openOnboardingMedianAgeDays: readiness.openOnboardingMedianAgeDays,
      definition: METRIC_DEFINITIONS.medianTimeToReadiness,
      sampleIds: readiness.sampleIds,
    },
    competencyAttainment: {
      value: attainment.rate,
      unit: "percent",
      numerator: attainment.numerator,
      denominator: attainment.denominator,
      definition: METRIC_DEFINITIONS.competencyAttainment,
    },
    onTimeCoaching: {
      value: coaching.onTimeRate,
      unit: "percent",
      onTimeCount: coaching.onTimeCount,
      dueCount: coaching.dueCount,
      eventualCompletionCount: coaching.eventualCompletionCount,
      overdueCount: coaching.overdueCount,
      definition: METRIC_DEFINITIONS.onTimeCoaching,
    },
    mslsRequiringAttention: {
      value: distinct.length,
      population: population.length,
      issues,
      distinctMslIds: distinct,
      definition: METRIC_DEFINITIONS.mslsRequiringAttention,
    },
    synthetic: true,
  };
}

export interface MslRosterRow {
  msl: MslProfile;
  directorName: string;
  readinessStatus: string;
  competenciesAttained: number;
  competenciesRequired: number;
  openCoachingActions: number;
  lastAssessmentAt: string | null;
}

export async function listMslRoster(options: {
  therapeuticArea?: TherapeuticArea | "all";
  query?: string;
  readiness?: string;
  attentionOnly?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "name" | "onboarding" | "readiness" | "coaching";
}): Promise<{ rows: MslRosterRow[]; total: number }> {
  const { store } = await loadFieldMedicalStore();
  const filters = {
    ...defaultAnalyticsFilters(),
    therapeuticArea: options.therapeuticArea ?? "all",
  };
  const latest = selectLatestAssessments(store.assessments);
  const approvals = firstActiveApprovalByMsl(store.readinessDecisions);
  const planByMsl = new Map<string, string[]>();
  for (const plan of store.coachingPlans) {
    const list = planByMsl.get(plan.mslId) ?? [];
    list.push(plan.id);
    planByMsl.set(plan.mslId, list);
  }

  let rows: MslRosterRow[] = store.msls
    .filter((m) => m.isActive)
    .filter((m) =>
      filters.therapeuticArea === "all"
        ? true
        : m.therapeuticArea === filters.therapeuticArea,
    )
    .map((msl) => {
      const applicable = requirementsApplicableAsOf(
        store.requirements,
        msl.therapeuticArea,
        filters.asOf,
      );
      let attained = 0;
      for (const req of applicable) {
        const key = latestAssessmentKey(
          msl.id,
          req.competencyId,
          req.rubricVersion,
        );
        const assessment = latest.get(key);
        if (
          assessment &&
          isAssessmentValidForAttainment(assessment, filters.asOf)
        ) {
          attained += 1;
        }
      }
      const planIds = new Set(planByMsl.get(msl.id) ?? []);
      const openCoachingActions = store.coachingActivities.filter(
        (a) =>
          planIds.has(a.planId) &&
          a.status !== "completed" &&
          a.status !== "cancelled",
      ).length;
      const mslAssessments = store.assessments
        .filter((a) => a.mslId === msl.id)
        .sort((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt));
      const status = readinessDisplayStatus(
        msl,
        store.readinessDecisions,
        attained === applicable.length && applicable.length > 0,
      );

      return {
        msl,
        directorName:
          store.directors.find((d) => d.id === msl.fieldDirectorId)?.fullName ??
          "—",
        readinessStatus: status,
        competenciesAttained: attained,
        competenciesRequired: applicable.length,
        openCoachingActions,
        lastAssessmentAt: mslAssessments[0]?.assessedAt ?? null,
      };
    });

  if (options.query) {
    const q = options.query.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.msl.fullName.toLowerCase().includes(q) ||
        r.msl.employeeCode.toLowerCase().includes(q) ||
        r.directorName.toLowerCase().includes(q),
    );
  }
  if (options.readiness && options.readiness !== "all") {
    rows = rows.filter((r) => r.readinessStatus === options.readiness);
  }

  if (options.attentionOnly) {
    const issues = calculateAttentionIssues({
      msls: store.msls,
      requirements: store.requirements,
      assessments: store.assessments,
      activities: store.coachingActivities,
      plans: store.coachingPlans,
      decisions: store.readinessDecisions,
      filters,
    });
    const attentionIds = new Set(distinctMslsRequiringAttention(issues));
    rows = rows.filter((r) => attentionIds.has(r.msl.id));
  }

  const sort = options.sort ?? "name";
  rows.sort((a, b) => {
    if (sort === "onboarding") {
      return a.msl.onboardingStartDate.localeCompare(b.msl.onboardingStartDate);
    }
    if (sort === "coaching") {
      return b.openCoachingActions - a.openCoachingActions;
    }
    if (sort === "readiness") {
      return a.readinessStatus.localeCompare(b.readinessStatus);
    }
    return a.msl.fullName.localeCompare(b.msl.fullName);
  });

  const total = rows.length;
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10));
  const start = (page - 1) * pageSize;

  void approvals;

  return { rows: rows.slice(start, start + pageSize), total };
}

export async function getMslDetail(mslId: string) {
  const { store } = await loadFieldMedicalStore();
  const msl = store.msls.find((m) => m.id === mslId);
  if (!msl) return null;

  const filters = defaultAnalyticsFilters();
  const applicable = requirementsApplicableAsOf(
    store.requirements,
    msl.therapeuticArea,
    filters.asOf,
  );
  const latest = selectLatestAssessments(
    store.assessments.filter((a) => a.mslId === msl.id),
  );
  const competencies = applicable.map((req) => {
    const competency = store.competencies.find((c) => c.id === req.competencyId)!;
    const key = latestAssessmentKey(msl.id, req.competencyId, req.rubricVersion);
    const assessment = latest.get(key) ?? null;
    return {
      requirement: req,
      competency,
      assessment,
      attained: assessment
        ? isAssessmentValidForAttainment(assessment, filters.asOf)
        : false,
    };
  });

  const assessments = store.assessments
    .filter((a) => a.mslId === mslId)
    .sort((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt));
  const plans = store.coachingPlans.filter((p) => p.mslId === mslId);
  const planIds = new Set(plans.map((p) => p.id));
  const activities = store.coachingActivities.filter((a) => planIds.has(a.planId));
  const decisions = store.readinessDecisions
    .filter((d) => d.mslId === mslId)
    .sort((a, b) => Date.parse(b.decidedAt) - Date.parse(a.decidedAt));
  const attempts = store.simulationAttempts.filter((a) => a.mslId === mslId);
  const auditEvents = store.auditEvents
    .filter(
      (e) =>
        (e.metadata && e.metadata.mslId === mslId) ||
        decisions.some((d) => d.id === e.entityId) ||
        activities.some((a) => a.id === e.entityId),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const attainedCount = competencies.filter((c) => c.attained).length;
  const status = readinessDisplayStatus(
    msl,
    store.readinessDecisions,
    attainedCount === competencies.length && competencies.length > 0,
  );

  return {
    msl,
    director: store.directors.find((d) => d.id === msl.fieldDirectorId) ?? null,
    readinessStatus: status,
    competencies,
    assessments,
    plans,
    activities,
    decisions,
    simulations: store.simulations,
    attempts,
    auditEvents,
    eligibility: {
      requiredCompetenciesMet: attainedCount === competencies.length,
      requiredCount: competencies.length,
      attainedCount,
      blockingMissing: competencies.filter((c) => !c.attained).map((c) => c.competency.code),
      hasActiveApproval: decisions.some((d) => d.outcome === "approved" && d.isActive),
    },
  };
}

export async function getCompetencyMatrix(therapeuticArea: TherapeuticArea | "all") {
  const { store } = await loadFieldMedicalStore();
  const filters = {
    ...defaultAnalyticsFilters(),
    therapeuticArea,
  };
  const msls = filterMslsByTherapeuticArea(store.msls, therapeuticArea).filter(
    (m) => m.isActive,
  );
  const latest = selectLatestAssessments(store.assessments);
  const competencyIds = [
    ...new Set(
      store.requirements
        .filter((r) => therapeuticArea === "all" || r.therapeuticArea === therapeuticArea)
        .filter((r) => r.isRequired)
        .map((r) => r.competencyId),
    ),
  ];
  const competencies = store.competencies.filter((c) =>
    competencyIds.includes(c.id),
  );

  const cells = msls.map((msl) => {
    const applicable = requirementsApplicableAsOf(
      store.requirements,
      msl.therapeuticArea,
      filters.asOf,
    );
    const byCompetency = competencies.map((competency) => {
      const req = applicable.find((r) => r.competencyId === competency.id);
      if (!req) {
        return { competencyId: competency.id, status: "not_applicable" as const };
      }
      const key = latestAssessmentKey(msl.id, req.competencyId, req.rubricVersion);
      const assessment = latest.get(key);
      if (assessment && isAssessmentValidForAttainment(assessment, filters.asOf)) {
        return { competencyId: competency.id, status: "attained" as const };
      }
      if (assessment?.validationStatus === "pending_review") {
        return { competencyId: competency.id, status: "pending" as const };
      }
      if (assessment && assessment.validationStatus === "validated" && !assessment.passed) {
        return { competencyId: competency.id, status: "failed" as const };
      }
      return { competencyId: competency.id, status: "missing" as const };
    });
    return { msl, cells: byCompetency };
  });

  const attainment = calculateCompetencyAttainment(
    store.msls,
    store.requirements,
    store.assessments,
    filters,
  );

  return {
    competencies,
    rows: cells,
    aggregate: {
      numerator: attainment.numerator,
      denominator: attainment.denominator,
      rate: attainment.rate,
      sampleSize: attainment.denominator,
    },
  };
}

export async function listCoachingWorkspace() {
  const { store } = await loadFieldMedicalStore();
  return {
    plans: store.coachingPlans,
    activities: store.coachingActivities,
    msls: store.msls,
    directors: store.directors,
    competencies: store.competencies,
  };
}

export async function getBottleneckAnalytics(filters: AnalyticsFilters) {
  const { store } = await loadFieldMedicalStore();
  const findings: BottleneckFinding[] = evaluateBottlenecks({
    msls: store.msls,
    requirements: store.requirements,
    assessments: store.assessments,
    activities: store.coachingActivities,
    plans: store.coachingPlans,
    decisions: store.readinessDecisions,
    filters,
  });

  const byTa = THERAPEUTIC_AREA_LABELS;
  const readinessByTa = (Object.keys(byTa) as TherapeuticArea[]).map((ta) => {
    const result = calculateMedianTimeToReadiness(store.msls, store.readinessDecisions, {
      ...filters,
      therapeuticArea: ta,
    });
    return {
      therapeuticArea: ta,
      label: byTa[ta],
      medianDays: result.medianDays,
      cohort: result.approvedCohortCount,
    };
  });

  const directorBacklog = store.directors.map((director) => {
    const mslIds = new Set(
      store.msls.filter((m) => m.fieldDirectorId === director.id).map((m) => m.id),
    );
    const planIds = new Set(
      store.coachingPlans
        .filter((p) => mslIds.has(p.mslId))
        .map((p) => p.id),
    );
    const overdue = store.coachingActivities.filter(
      (a) =>
        planIds.has(a.planId) &&
        a.status !== "completed" &&
        a.status !== "cancelled" &&
        Date.parse(a.dueAt) < Date.parse(filters.asOf),
    ).length;
    return {
      directorId: director.id,
      directorName: director.fullName,
      overdue,
    };
  });

  return {
    findings,
    readinessByTa,
    directorBacklog,
    synthetic: true as const,
  };
}
