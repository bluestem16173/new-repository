import { z } from "zod";

export const provisionalEvaluationSchema = z.object({
  scientificAccuracy: z.number().min(0).max(100),
  evidenceInterpretation: z.number().min(0).max(100),
  compliance: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  uncertaintyHandling: z.number().min(0).max(100),
  criticalInaccuracyFlags: z.array(z.string()),
  notes: z.string().min(1).max(4000),
});

export const simulationReplySchema = z.object({
  sessionId: z.string().uuid(),
  mslMessage: z.string().trim().min(1).max(4000),
});

export const claimReviewSchema = z.object({
  claimId: z.string().uuid(),
  status: z.enum(["pending", "supported", "needs_revision", "unsupported"]),
  reviewerNotes: z.string().trim().max(2000).optional().nullable(),
});

export const validateEvaluationSchema = z.object({
  evaluationId: z.string().uuid(),
  approve: z.boolean(),
});
