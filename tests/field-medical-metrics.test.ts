import { describe, expect, it } from "vitest";
import {
  calculateAttentionIssues,
  calculateCompetencyAttainment,
  calculateMedianTimeToReadiness,
  calculateOnTimeCoachingCompletion,
  defaultAnalyticsFilters,
  distinctMslsRequiringAttention,
  firstActiveApprovalByMsl,
  filterMslsByTherapeuticArea,
} from "@/domain/field-medical/metrics";
import { evaluateBottlenecks } from "@/domain/field-medical/bottlenecks";
import { createFieldMedicalSeed } from "@/lib/demo/field-medical-seed";
import type {
  Assessment,
  CoachingActivity,
  CoachingPlan,
  CompetencyRequirement,
  MslProfile,
  ReadinessDecision,
} from "@/domain/field-medical/types";

const filters = defaultAnalyticsFilters();

describe("field medical seed corpus", () => {
  it("creates deterministic counts for the fixed seed", () => {
    const a = createFieldMedicalSeed();
    const b = createFieldMedicalSeed();
    expect(a.msls).toHaveLength(64);
    expect(a.directors).toHaveLength(8);
    expect(a.assessments.length).toBeGreaterThanOrEqual(500);
    expect(a.coachingActivities.length).toBeGreaterThanOrEqual(120);
    expect(a.msls.map((m) => m.id)).toEqual(b.msls.map((m) => m.id));
    expect(a.assessments.length).toBe(b.assessments.length);
  });
});

describe("median time to readiness", () => {
  it("uses first active approval and ignores inactive duplicates", () => {
    const msls: MslProfile[] = [
      {
        id: "m1",
        profileId: null,
        employeeCode: "MSL-001",
        fullName: "Test MSL",
        email: "t@demo.local",
        therapeuticArea: "oncology",
        fieldDirectorId: "d1",
        onboardingStartDate: "2025-01-01",
        region: "West",
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const decisions: ReadinessDecision[] = [
      {
        id: "r1",
        mslId: "m1",
        outcome: "approved",
        decidedByDirectorId: "d1",
        decidedAt: "2025-06-01T00:00:00.000Z",
        rationale: "first",
        evidenceSummary: null,
        isActive: true,
        createdAt: "2025-06-01T00:00:00.000Z",
      },
      {
        id: "r2",
        mslId: "m1",
        outcome: "approved",
        decidedByDirectorId: "d1",
        decidedAt: "2025-06-10T00:00:00.000Z",
        rationale: "duplicate inactive",
        evidenceSummary: null,
        isActive: false,
        createdAt: "2025-06-10T00:00:00.000Z",
      },
    ];

    const map = firstActiveApprovalByMsl(decisions);
    expect(map.get("m1")?.id).toBe("r1");

    const result = calculateMedianTimeToReadiness(msls, decisions, filters);
    expect(result.approvedCohortCount).toBe(1);
    expect(result.medianDays).toBe(151);
  });

  it("does not treat unapproved MSLs as readiness completions", () => {
    const store = createFieldMedicalSeed();
    const result = calculateMedianTimeToReadiness(
      store.msls,
      store.readinessDecisions,
      filters,
    );
    expect(result.approvedCohortCount).toBe(result.sampleIds.length);
    for (const id of result.sampleIds) {
      const approved = store.readinessDecisions.some(
        (d) => d.mslId === id && d.outcome === "approved" && d.isActive,
      );
      expect(approved).toBe(true);
    }
  });
});

describe("competency attainment", () => {
  it("excludes expired and superseded assessments from numerator", () => {
    const msls: MslProfile[] = [
      {
        id: "m1",
        profileId: null,
        employeeCode: "MSL-001",
        fullName: "Test",
        email: "t@demo.local",
        therapeuticArea: "oncology",
        fieldDirectorId: "d1",
        onboardingStartDate: "2025-01-01",
        region: "West",
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const requirements: CompetencyRequirement[] = [
      {
        id: "req1",
        competencyId: "c1",
        therapeuticArea: "oncology",
        rubricVersion: "2025.2",
        passingScore: 80,
        effectiveFrom: "2025-01-01",
        effectiveTo: null,
        isRequired: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const assessments: Assessment[] = [
      {
        id: "a1",
        mslId: "m1",
        competencyId: "c1",
        requirementId: "req1",
        rubricVersion: "2025.2",
        score: 90,
        passed: true,
        validationStatus: "superseded",
        assessedAt: "2025-06-01T00:00:00.000Z",
        validUntil: "2026-06-01T00:00:00.000Z",
        reviewerId: "d1",
        evidenceReference: null,
        notes: null,
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-01T00:00:00.000Z",
      },
      {
        id: "a2",
        mslId: "m1",
        competencyId: "c1",
        requirementId: "req1",
        rubricVersion: "2025.2",
        score: 88,
        passed: true,
        validationStatus: "expired",
        assessedAt: "2025-07-01T00:00:00.000Z",
        validUntil: "2025-12-01T00:00:00.000Z",
        reviewerId: "d1",
        evidenceReference: null,
        notes: null,
        createdAt: "2025-07-01T00:00:00.000Z",
        updatedAt: "2025-07-01T00:00:00.000Z",
      },
    ];

    const result = calculateCompetencyAttainment(
      msls,
      requirements,
      assessments,
      filters,
    );
    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(0);
    expect(result.rate).toBe(0);
  });
});

describe("coaching completion", () => {
  it("separates on-time, eventual, and overdue", () => {
    const msls: MslProfile[] = [
      {
        id: "m1",
        profileId: null,
        employeeCode: "MSL-001",
        fullName: "Test",
        email: "t@demo.local",
        therapeuticArea: "oncology",
        fieldDirectorId: "d1",
        onboardingStartDate: "2025-01-01",
        region: "West",
        isActive: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const plans: CoachingPlan[] = [
      {
        id: "p1",
        mslId: "m1",
        directorId: "d1",
        title: "Plan",
        focusCompetencyId: null,
        status: "active",
        objective: "Objective text here",
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-01T00:00:00.000Z",
      },
    ];
    const activities: CoachingActivity[] = [
      {
        id: "act1",
        planId: "p1",
        title: "On time",
        description: null,
        dueAt: "2025-08-01T00:00:00.000Z",
        completedAt: "2025-07-30T00:00:00.000Z",
        status: "completed",
        outcomeNotes: "ok",
        reassessmentScheduledAt: null,
        createdAt: "2025-07-01T00:00:00.000Z",
        updatedAt: "2025-07-30T00:00:00.000Z",
      },
      {
        id: "act2",
        planId: "p1",
        title: "Late",
        description: null,
        dueAt: "2025-09-01T00:00:00.000Z",
        completedAt: "2025-09-10T00:00:00.000Z",
        status: "completed",
        outcomeNotes: "late",
        reassessmentScheduledAt: null,
        createdAt: "2025-08-01T00:00:00.000Z",
        updatedAt: "2025-09-10T00:00:00.000Z",
      },
      {
        id: "act3",
        planId: "p1",
        title: "Overdue",
        description: null,
        dueAt: "2025-10-01T00:00:00.000Z",
        completedAt: null,
        status: "planned",
        outcomeNotes: null,
        reassessmentScheduledAt: null,
        createdAt: "2025-09-01T00:00:00.000Z",
        updatedAt: "2025-09-01T00:00:00.000Z",
      },
    ];

    const result = calculateOnTimeCoachingCompletion(
      activities,
      plans,
      msls,
      filters,
    );
    expect(result.dueCount).toBe(3);
    expect(result.onTimeCount).toBe(1);
    expect(result.eventualCompletionCount).toBe(2);
    expect(result.overdueCount).toBe(1);
  });
});

describe("attention deduplication and filters", () => {
  it("deduplicates MSLs with multiple issues", () => {
    const store = createFieldMedicalSeed();
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
    expect(distinct.length).toBeLessThanOrEqual(issues.length);
    expect(new Set(distinct).size).toBe(distinct.length);
  });

  it("filters by therapeutic area", () => {
    const store = createFieldMedicalSeed();
    const oncology = filterMslsByTherapeuticArea(store.msls, "oncology");
    expect(oncology.every((m) => m.therapeuticArea === "oncology")).toBe(true);
    expect(oncology.length).toBe(16);
  });
});

describe("bottleneck evaluation", () => {
  it("returns rule metadata with sample sizes", () => {
    const store = createFieldMedicalSeed();
    const findings = evaluateBottlenecks({
      msls: store.msls,
      requirements: store.requirements,
      assessments: store.assessments,
      activities: store.coachingActivities,
      plans: store.coachingPlans,
      decisions: store.readinessDecisions,
      filters,
    });
    for (const finding of findings) {
      expect(finding.ruleId).toMatch(/^FM-BN-/);
      expect(finding.sampleSize).toBeGreaterThan(0);
      expect(finding.affectedRecordIds.length).toBeGreaterThan(0);
    }
  });
});
