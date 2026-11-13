import { z } from "zod";
import { THERAPEUTIC_AREAS } from "@/domain/field-medical/types";

export const therapeuticAreaSchema = z.enum([
  "oncology",
  "inflammation",
  "rare_disease",
  "general_medicine",
]);

export const analyticsFilterSchema = z.object({
  periodStart: z.string().datetime({ offset: true }),
  periodEnd: z.string().datetime({ offset: true }),
  therapeuticArea: z.union([therapeuticAreaSchema, z.literal("all")]),
  asOf: z.string().datetime({ offset: true }),
  reportingTimeZone: z.string().min(1),
});

export const createCoachingPlanSchema = z.object({
  mslId: z.string().uuid(),
  title: z.string().trim().min(4).max(160),
  objective: z.string().trim().min(8).max(2000),
  focusCompetencyId: z.string().uuid().optional().nullable(),
});

export const assignCoachingActivitySchema = z.object({
  planId: z.string().uuid(),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  dueAt: z.string().datetime({ offset: true }),
});

export const completeCoachingActivitySchema = z.object({
  activityId: z.string().uuid(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  outcomeNotes: z.string().trim().min(4).max(4000),
  scheduleReassessment: z.boolean().optional(),
  reassessmentScheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const approveReadinessSchema = z.object({
  mslId: z.string().uuid(),
  outcome: z.enum(["approved", "deferred", "denied"]),
  rationale: z.string().trim().min(8).max(4000),
  evidenceSummary: z.string().trim().max(4000).optional().nullable(),
});

export type CreateCoachingPlanInput = z.infer<typeof createCoachingPlanSchema>;
export type AssignCoachingActivityInput = z.infer<
  typeof assignCoachingActivitySchema
>;
export type CompleteCoachingActivityInput = z.infer<
  typeof completeCoachingActivitySchema
>;
export type ApproveReadinessInput = z.infer<typeof approveReadinessSchema>;

export function isTherapeuticAreaFilter(
  value: string,
): value is (typeof THERAPEUTIC_AREAS)[number] | "all" {
  return value === "all" || (THERAPEUTIC_AREAS as string[]).includes(value);
}
