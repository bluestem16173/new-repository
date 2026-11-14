export type KnowledgeItemStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "retired"
  | "needs_rereview";

export type KnowledgeApplicability =
  | "approved_for_reuse"
  | "similar_not_applicable"
  | "requires_adaptation"
  | "insufficient_context";

export type KnowledgeCurrencyStatus =
  | "current"
  | "aging"
  | "outdated"
  | "unknown";

export type KnowledgeMatchDecision =
  | "accepted"
  | "rejected"
  | "adapted"
  | "escalated"
  | "viewed";

export type KnowledgeReviewDecision =
  | "submitted"
  | "approved"
  | "rejected"
  | "returned"
  | "retired"
  | "flagged_rereview";

export interface KnowledgeItem {
  id: string;
  slug: string;
  title: string;
  questionSummary: string;
  therapeuticArea: string;
  productName: string | null;
  indication: string | null;
  diseaseState: string | null;
  jurisdiction: string;
  status: KnowledgeItemStatus;
  applicabilityScope: string;
  currencyStatus: KnowledgeCurrencyStatus;
  currentVersion: number;
  sourceInquiryId: string | null;
  ownerProfileId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItemVersion {
  id: string;
  knowledgeItemId: string;
  versionNumber: number;
  answerText: string;
  uncertaintyNotes: string | null;
  limitationsNotes: string | null;
  deidentificationNotes: string;
  createdById: string | null;
  createdAt: string;
}

export interface KnowledgeEvidenceLink {
  id: string;
  knowledgeItemId: string;
  versionNumber: number;
  siDocumentId: string | null;
  siPassageId: string | null;
  evidenceDocumentId: string | null;
  citationNote: string | null;
  createdAt: string;
}

export interface KnowledgeMatch {
  id: string;
  inquiryId: string | null;
  knowledgeItemId: string;
  queryText: string;
  relevanceScore: number;
  relevanceRationale: string;
  matchedConcepts: string[];
  applicability: KnowledgeApplicability;
  currencyStatus: KnowledgeCurrencyStatus;
  applicabilityWarnings: string[];
  recommendedNextAction: string;
  createdById: string | null;
  createdAt: string;
}

export interface KnowledgeReuseEvent {
  id: string;
  knowledgeItemId: string;
  matchId: string | null;
  inquiryId: string | null;
  decision: KnowledgeMatchDecision;
  actorProfileId: string | null;
  verificationNotes: string | null;
  adaptationNotes: string | null;
  searchDurationMs: number | null;
  verificationDurationMs: number | null;
  createdAt: string;
}

export interface KnowledgeReviewEvent {
  id: string;
  knowledgeItemId: string;
  versionNumber: number;
  decision: KnowledgeReviewDecision;
  reviewerProfileId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface KnowledgeSearchEvent {
  id: string;
  queryText: string;
  therapeuticArea: string | null;
  productName: string | null;
  resultCount: number;
  actorProfileId: string | null;
  inquiryId: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface KnowledgeValueAssumptions {
  id: string;
  label: string;
  mslWorkforceSize: number;
  monthlyResearchInquiriesPerMsl: number;
  eligibleReusePercentage: number;
  netMinutesSavedPerReuse: number;
  loadedHourlyLaborCost: number;
  notes: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeMatchSuggestion {
  knowledgeItemId: string;
  relevanceRationale: string;
  matchedScientificConcepts: string[];
  evidenceIdentifiers: string[];
  applicabilityWarnings: string[];
  currencyStatus: KnowledgeCurrencyStatus;
  applicability: KnowledgeApplicability;
  recommendedNextAction: string;
  relevanceScore: number;
  item: KnowledgeItem;
}

export interface KnowledgeSearchFilters {
  query?: string;
  therapeuticArea?: string;
  productName?: string;
  diseaseState?: string;
  status?: KnowledgeItemStatus | "all";
  currencyStatus?: KnowledgeCurrencyStatus | "all";
  limit?: number;
}

export const KNOWLEDGE_STATUS_LABELS: Record<KnowledgeItemStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  retired: "Retired",
  needs_rereview: "Needs re-review",
};

export const KNOWLEDGE_APPLICABILITY_LABELS: Record<
  KnowledgeApplicability,
  string
> = {
  approved_for_reuse: "Similarity + eligible for scoped reuse after verification",
  similar_not_applicable: "Similar wording — not approved applicable",
  requires_adaptation: "Requires adaptation + human review",
  insufficient_context: "Insufficient context to judge applicability",
};

export const KNOWLEDGE_CURRENCY_LABELS: Record<KnowledgeCurrencyStatus, string> =
  {
    current: "Current",
    aging: "Aging",
    outdated: "Outdated",
    unknown: "Unknown",
  };
