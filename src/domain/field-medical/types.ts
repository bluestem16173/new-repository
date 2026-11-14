export type TherapeuticArea =
  | "oncology"
  | "inflammation"
  | "rare_disease"
  | "general_medicine";

export const THERAPEUTIC_AREAS: TherapeuticArea[] = [
  "oncology",
  "inflammation",
  "rare_disease",
  "general_medicine",
];

export const THERAPEUTIC_AREA_LABELS: Record<TherapeuticArea, string> = {
  oncology: "Oncology",
  inflammation: "Inflammation",
  rare_disease: "Rare Disease",
  general_medicine: "General Medicine",
};

export type AssessmentValidationStatus =
  | "pending_review"
  | "validated"
  | "rejected"
  | "expired"
  | "superseded";

export type CoachingPlanStatus = "draft" | "active" | "completed" | "cancelled";
export type CoachingActivityStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ReadinessDecisionOutcome = "approved" | "deferred" | "denied";

export type ReadinessDisplayStatus =
  | "not_started"
  | "in_progress"
  | "eligible"
  | "approved"
  | "deferred"
  | "denied";

export interface FieldDirector {
  id: string;
  profileId: string | null;
  employeeCode: string;
  fullName: string;
  email: string;
  primaryTherapeuticArea: TherapeuticArea;
  createdAt: string;
  updatedAt: string;
}

export interface MslProfile {
  id: string;
  profileId: string | null;
  employeeCode: string;
  fullName: string;
  email: string;
  therapeuticArea: TherapeuticArea;
  fieldDirectorId: string;
  onboardingStartDate: string; // YYYY-MM-DD
  region: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FmCompetency {
  id: string;
  code: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyRequirement {
  id: string;
  competencyId: string;
  therapeuticArea: TherapeuticArea;
  rubricVersion: string;
  passingScore: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isRequired: boolean;
  createdAt: string;
}

export interface Assessment {
  id: string;
  mslId: string;
  competencyId: string;
  requirementId: string | null;
  rubricVersion: string;
  score: number;
  passed: boolean;
  validationStatus: AssessmentValidationStatus;
  assessedAt: string;
  validUntil: string | null;
  reviewerId: string | null;
  evidenceReference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessDecision {
  id: string;
  mslId: string;
  outcome: ReadinessDecisionOutcome;
  decidedByDirectorId: string;
  decidedAt: string;
  rationale: string;
  evidenceSummary: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CoachingPlan {
  id: string;
  mslId: string;
  directorId: string;
  title: string;
  focusCompetencyId: string | null;
  status: CoachingPlanStatus;
  objective: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingActivity {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  dueAt: string;
  completedAt: string | null;
  status: CoachingActivityStatus;
  outcomeNotes: string | null;
  reassessmentScheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Simulation {
  id: string;
  competencyId: string;
  title: string;
  scenarioSummary: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  createdAt: string;
}

export interface SimulationAttempt {
  id: string;
  simulationId: string;
  mslId: string;
  attemptedAt: string;
  score: number;
  passed: boolean;
  facilitatorNotes: string | null;
  createdAt: string;
}

export interface FmAuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AnalyticsFilters {
  /** Inclusive UTC start of reporting window */
  periodStart: string;
  /** Exclusive UTC end of reporting window */
  periodEnd: string;
  therapeuticArea: TherapeuticArea | "all";
  /** As-of instant for competency applicability / expiry */
  asOf: string;
  /** IANA timezone used for calendar-day boundaries in coaching due logic */
  reportingTimeZone: string;
}

export interface MetricDefinition {
  id: string;
  name: string;
  definition: string;
  numeratorLabel: string;
  denominatorLabel: string;
}

export type AttentionIssueCategory =
  | "overdue_coaching"
  | "missing_required_competency"
  | "failed_validated_assessment"
  | "extended_onboarding";

export type AttentionSeverity = "high" | "medium" | "low";

export interface AttentionIssue {
  mslId: string;
  category: AttentionIssueCategory;
  severity: AttentionSeverity;
  detail: string;
}

export interface BottleneckFinding {
  ruleId: string;
  title: string;
  threshold: string;
  measuredValue: string;
  baseline: string;
  population: string;
  sampleSize: number;
  severity: AttentionSeverity;
  suggestedInvestigation: string;
  affectedRecordIds: string[];
  unstable: boolean;
}
