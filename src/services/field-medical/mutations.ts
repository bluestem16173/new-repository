import { randomUUID } from "crypto";
import {
  assertCanApproveReadiness,
  assertCanMutateCoaching,
  assertNotSelfApproval,
} from "@/domain/field-medical/authorization";
import {
  approveReadinessSchema,
  assignCoachingActivitySchema,
  completeCoachingActivitySchema,
  createCoachingPlanSchema,
  type ApproveReadinessInput,
  type AssignCoachingActivityInput,
  type CompleteCoachingActivityInput,
  type CreateCoachingPlanInput,
} from "@/domain/field-medical/schemas";
import {
  isAssessmentValidForAttainment,
  latestAssessmentKey,
  requirementsApplicableAsOf,
  selectLatestAssessments,
  defaultAnalyticsFilters,
} from "@/domain/field-medical/metrics";
import type {
  CoachingActivity,
  CoachingPlan,
  FmAuditEvent,
  ReadinessDecision,
} from "@/domain/field-medical/types";
import { getCurrentUser } from "@/lib/session";
import { getFieldMedicalStore } from "@/lib/demo/field-medical-seed";
import { getRuntimeMode } from "@/lib/supabase/env";

function appendAudit(
  event: Omit<FmAuditEvent, "id" | "createdAt"> & { createdAt?: string },
): FmAuditEvent {
  const record: FmAuditEvent = {
    id: randomUUID(),
    createdAt: event.createdAt ?? new Date().toISOString(),
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    actorRole: event.actorRole,
    actorName: event.actorName,
    metadata: event.metadata,
  };
  getFieldMedicalStore().auditEvents.unshift(record);
  return record;
}

function demoDirectorIdForActor(): string {
  const store = getFieldMedicalStore();
  // Demo: map field_director session to first director; admin/reviewer act as first director.
  return store.directors[0]?.id;
}

export async function createCoachingPlan(
  raw: CreateCoachingPlanInput,
): Promise<CoachingPlan> {
  const user = await getCurrentUser();
  assertCanMutateCoaching(user.role);
  const input = createCoachingPlanSchema.parse(raw);
  const store = getFieldMedicalStore();
  const msl = store.msls.find((m) => m.id === input.mslId);
  if (!msl) throw new Error("MSL not found");

  const now = new Date().toISOString();
  const plan: CoachingPlan = {
    id: randomUUID(),
    mslId: input.mslId,
    directorId: msl.fieldDirectorId,
    title: input.title,
    focusCompetencyId: input.focusCompetencyId ?? null,
    status: "active",
    objective: input.objective,
    createdAt: now,
    updatedAt: now,
  };
  store.coachingPlans.unshift(plan);
  appendAudit({
    entityType: "fm_coaching_plan",
    entityId: plan.id,
    action: "coaching_plan_created",
    actorRole: user.role,
    actorName: user.fullName,
    metadata: {
      mslId: plan.mslId,
      persisted: getRuntimeMode() === "demo" ? false : false,
      synthetic: true,
    },
  });
  return plan;
}

export async function assignCoachingActivity(
  raw: AssignCoachingActivityInput,
): Promise<CoachingActivity> {
  const user = await getCurrentUser();
  assertCanMutateCoaching(user.role);
  const input = assignCoachingActivitySchema.parse(raw);
  const store = getFieldMedicalStore();
  const plan = store.coachingPlans.find((p) => p.id === input.planId);
  if (!plan) throw new Error("Coaching plan not found");

  const now = new Date().toISOString();
  const activity: CoachingActivity = {
    id: randomUUID(),
    planId: input.planId,
    title: input.title,
    description: input.description ?? null,
    dueAt: input.dueAt,
    completedAt: null,
    status: "planned",
    outcomeNotes: null,
    reassessmentScheduledAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.coachingActivities.unshift(activity);
  appendAudit({
    entityType: "fm_coaching_activity",
    entityId: activity.id,
    action: "coaching_activity_assigned",
    actorRole: user.role,
    actorName: user.fullName,
    metadata: { planId: plan.id, mslId: plan.mslId, synthetic: true },
  });
  return activity;
}

const completionLocks = new Set<string>();

export async function completeCoachingActivity(
  raw: CompleteCoachingActivityInput,
): Promise<CoachingActivity> {
  const user = await getCurrentUser();
  assertCanMutateCoaching(user.role);
  const input = completeCoachingActivitySchema.parse(raw);

  if (completionLocks.has(input.activityId)) {
    throw new Error("Duplicate completion request in progress.");
  }
  completionLocks.add(input.activityId);

  try {
    const store = getFieldMedicalStore();
    const index = store.coachingActivities.findIndex(
      (a) => a.id === input.activityId,
    );
    if (index < 0) throw new Error("Coaching activity not found");
    const existing = store.coachingActivities[index];
    if (existing.status === "completed") {
      throw new Error("Activity already completed.");
    }

    const completedAt = input.completedAt ?? new Date().toISOString();
    const updated: CoachingActivity = {
      ...existing,
      status: "completed",
      completedAt,
      outcomeNotes: input.outcomeNotes,
      reassessmentScheduledAt: input.scheduleReassessment
        ? input.reassessmentScheduledAt ?? null
        : existing.reassessmentScheduledAt,
      updatedAt: completedAt,
    };
    store.coachingActivities[index] = updated;

    const plan = store.coachingPlans.find((p) => p.id === updated.planId);
    appendAudit({
      entityType: "fm_coaching_activity",
      entityId: updated.id,
      action: "coaching_activity_completed",
      actorRole: user.role,
      actorName: user.fullName,
      metadata: {
        planId: updated.planId,
        mslId: plan?.mslId ?? null,
        synthetic: true,
      },
      createdAt: completedAt,
    });
    return updated;
  } finally {
    completionLocks.delete(input.activityId);
  }
}

export async function evaluateReadinessEligibility(mslId: string): Promise<{
  eligible: boolean;
  requiredCount: number;
  attainedCount: number;
  blockingMissing: string[];
  alreadyApproved: boolean;
}> {
  const store = getFieldMedicalStore();
  const msl = store.msls.find((m) => m.id === mslId);
  if (!msl) throw new Error("MSL not found");
  const filters = defaultAnalyticsFilters();
  const applicable = requirementsApplicableAsOf(
    store.requirements,
    msl.therapeuticArea,
    filters.asOf,
  );
  const latest = selectLatestAssessments(
    store.assessments.filter((a) => a.mslId === mslId),
  );
  const missing: string[] = [];
  let attained = 0;
  for (const req of applicable) {
    const competency = store.competencies.find((c) => c.id === req.competencyId);
    const key = latestAssessmentKey(mslId, req.competencyId, req.rubricVersion);
    const assessment = latest.get(key);
    if (assessment && isAssessmentValidForAttainment(assessment, filters.asOf)) {
      attained += 1;
    } else {
      missing.push(competency?.code ?? req.competencyId);
    }
  }
  const alreadyApproved = store.readinessDecisions.some(
    (d) => d.mslId === mslId && d.outcome === "approved" && d.isActive,
  );
  return {
    eligible: missing.length === 0 && applicable.length > 0,
    requiredCount: applicable.length,
    attainedCount: attained,
    blockingMissing: missing,
    alreadyApproved,
  };
}

export async function decideReadiness(
  raw: ApproveReadinessInput,
): Promise<ReadinessDecision> {
  const user = await getCurrentUser();
  assertCanApproveReadiness(user.role);
  const input = approveReadinessSchema.parse(raw);
  const store = getFieldMedicalStore();
  const msl = store.msls.find((m) => m.id === input.mslId);
  if (!msl) throw new Error("MSL not found");

  assertNotSelfApproval({
    actorProfileId: user.id,
    mslProfileId: msl.profileId,
  });

  const eligibility = await evaluateReadinessEligibility(input.mslId);
  if (input.outcome === "approved") {
    if (eligibility.alreadyApproved) {
      throw new Error("Active readiness approval already exists for this MSL.");
    }
    if (!eligibility.eligible) {
      throw new Error(
        `Readiness not eligible. Missing: ${eligibility.blockingMissing.join(", ") || "requirements"}`,
      );
    }
  }

  const decidedAt = new Date().toISOString();
  const decision: ReadinessDecision = {
    id: randomUUID(),
    mslId: input.mslId,
    outcome: input.outcome,
    decidedByDirectorId: msl.fieldDirectorId || demoDirectorIdForActor(),
    decidedAt,
    rationale: input.rationale,
    evidenceSummary: input.evidenceSummary ?? null,
    isActive: true,
    createdAt: decidedAt,
  };

  // Deactivate prior active decisions of same outcome to avoid duplicate approvals
  for (const existing of store.readinessDecisions) {
    if (
      existing.mslId === input.mslId &&
      existing.outcome === "approved" &&
      existing.isActive &&
      input.outcome === "approved"
    ) {
      existing.isActive = false;
    }
  }

  store.readinessDecisions.unshift(decision);
  appendAudit({
    entityType: "fm_readiness_decision",
    entityId: decision.id,
    action: `readiness_${decision.outcome}`,
    actorRole: user.role,
    actorName: user.fullName,
    metadata: {
      mslId: msl.id,
      eligibility,
      synthetic: true,
    },
    createdAt: decidedAt,
  });
  return decision;
}
