import { z } from "zod";

export const knowledgeItemStatusSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "retired",
  "needs_rereview",
]);

export const knowledgeApplicabilitySchema = z.enum([
  "approved_for_reuse",
  "similar_not_applicable",
  "requires_adaptation",
  "insufficient_context",
]);

export const knowledgeCurrencyStatusSchema = z.enum([
  "current",
  "aging",
  "outdated",
  "unknown",
]);

export const knowledgeMatchDecisionSchema = z.enum([
  "accepted",
  "rejected",
  "adapted",
  "escalated",
  "viewed",
]);

/** Zod-validated Scientific Knowledge Matching Agent output. */
export const knowledgeMatchAgentResultSchema = z.object({
  knowledge_item_id: z.string().uuid().nullable(),
  relevance_rationale: z.string().min(1),
  matched_scientific_concepts: z.array(z.string()),
  evidence_identifiers: z.array(z.string()),
  applicability_warnings: z.array(z.string()),
  currency_status: knowledgeCurrencyStatusSchema,
  recommended_next_action: z.string().min(1),
  no_supported_match: z.boolean(),
  relevance_score: z.number().min(0).max(100).nullable(),
  applicability: knowledgeApplicabilitySchema.nullable(),
});

export type KnowledgeMatchAgentResult = z.infer<
  typeof knowledgeMatchAgentResultSchema
>;

export const createKnowledgeItemInputSchema = z.object({
  title: z.string().min(8).max(240),
  questionSummary: z.string().min(12).max(4000),
  answerText: z.string().min(24).max(16000),
  therapeuticArea: z.string().min(2).max(120),
  productName: z.string().max(160).optional().nullable(),
  indication: z.string().max(240).optional().nullable(),
  diseaseState: z.string().max(240).optional().nullable(),
  jurisdiction: z.string().max(40).default("US"),
  applicabilityScope: z.string().min(8).max(800),
  currencyStatus: knowledgeCurrencyStatusSchema.default("unknown"),
  sourceInquiryId: z.string().uuid().optional().nullable(),
  uncertaintyNotes: z.string().max(4000).optional().nullable(),
  limitationsNotes: z.string().max(4000).optional().nullable(),
  siPassageIds: z.array(z.string().uuid()).default([]),
  evidenceDocumentIds: z.array(z.string().uuid()).default([]),
});

export type CreateKnowledgeItemInput = z.infer<
  typeof createKnowledgeItemInputSchema
>;

export const recordReuseInputSchema = z.object({
  knowledgeItemId: z.string().uuid(),
  matchId: z.string().uuid().optional().nullable(),
  inquiryId: z.string().uuid().optional().nullable(),
  decision: knowledgeMatchDecisionSchema,
  verificationNotes: z.string().max(4000).optional().nullable(),
  adaptationNotes: z.string().max(4000).optional().nullable(),
  searchDurationMs: z.number().int().nonnegative().optional().nullable(),
  verificationDurationMs: z.number().int().nonnegative().optional().nullable(),
});

export type RecordReuseInput = z.infer<typeof recordReuseInputSchema>;

export const knowledgeValueAssumptionsSchema = z.object({
  mslWorkforceSize: z.number().positive().max(100000),
  monthlyResearchInquiriesPerMsl: z.number().nonnegative().max(1000),
  eligibleReusePercentage: z.number().min(0).max(1),
  netMinutesSavedPerReuse: z.number().nonnegative().max(24 * 60),
  loadedHourlyLaborCost: z.number().nonnegative().max(10000),
});

export type KnowledgeValueAssumptionsInput = z.infer<
  typeof knowledgeValueAssumptionsSchema
>;

/**
 * Scenario model only — never present as observed employer savings.
 * Monthly net hours = MSL * inquiries/MSL * reuse fraction * minutes / 60
 */
export function calculateScenarioCapacity(input: KnowledgeValueAssumptionsInput) {
  const monthlyNetHoursRecovered =
    input.mslWorkforceSize *
    input.monthlyResearchInquiriesPerMsl *
    input.eligibleReusePercentage *
    (input.netMinutesSavedPerReuse / 60);

  const monthlyEquivalentCapacityValue =
    monthlyNetHoursRecovered * input.loadedHourlyLaborCost;

  return {
    monthlyNetHoursRecovered,
    monthlyEquivalentCapacityValue,
    label: "Scenario Estimate",
    formula:
      "Monthly net hours recovered = MSL count × monthly inquiries per MSL × eligible reuse fraction × net minutes saved / 60; Monthly equivalent capacity value = monthly net hours × loaded hourly labor cost",
  };
}
