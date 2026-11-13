import { assertSyntheticRuntime } from "@/lib/demo/guard";
import type {
  KnowledgeEvidenceLink,
  KnowledgeItem,
  KnowledgeItemVersion,
  KnowledgeMatch,
  KnowledgeReuseEvent,
  KnowledgeReviewEvent,
  KnowledgeSearchEvent,
  KnowledgeValueAssumptions,
} from "@/domain/knowledge/types";

export const KNOWLEDGE_NETWORK_NOTICE =
  "Scientific Knowledge Network demo data is synthetic and clearly labeled. It does not contain real HCP, patient, or proprietary field-interaction content. Approved reusable answers are de-identified teaching examples — never auto-sent to HCPs.";

export interface KnowledgeStore {
  items: KnowledgeItem[];
  versions: KnowledgeItemVersion[];
  evidenceLinks: KnowledgeEvidenceLink[];
  matches: KnowledgeMatch[];
  reuseEvents: KnowledgeReuseEvent[];
  reviewEvents: KnowledgeReviewEvent[];
  searchEvents: KnowledgeSearchEvent[];
  assumptions: KnowledgeValueAssumptions;
}

declare global {
  var __medintelKnowledgeStore: KnowledgeStore | undefined;
}

const T0 = "2026-10-01T14:00:00.000Z";
const T1 = "2026-10-02T16:30:00.000Z";
const T2 = "2026-10-03T11:15:00.000Z";
const T3 = "2026-10-04T09:40:00.000Z";

function createKnowledgeStore(): KnowledgeStore {
  const itemAId = "0394271c-df2e-5175-b5d6-bd09965f7b8c";
  const itemPendingId = "29a87293-1186-5b03-b144-f10792563be8";
  const versionAId = "0a4d318f-72ae-5322-a0fe-4c8cda5c779b";
  const matchBId = "4fce1a40-a932-5b98-bdef-013772530ab2";

  const items: KnowledgeItem[] = [
    {
      id: itemAId,
      slug: "cardiorenal-endpoint-framing-glp1",
      title:
        "[SYNTHETIC] Framing primary cardiorenal endpoints for labeled GLP-1 discussion",
      questionSummary:
        "How should an MSL discuss primary versus secondary cardiorenal outcomes when a KOL asks about a labeled GLP-1 metabolic therapy in adults with obesity and established CV risk?",
      therapeuticArea: "General Medicine",
      productName: "MediMet GLP-1 (synthetic label)",
      indication: "Adult obesity with weight-related comorbidity (synthetic label)",
      diseaseState: "Obesity / cardiorenal risk",
      jurisdiction: "US",
      status: "approved",
      applicabilityScope:
        "Labeled scientific exchange only; no off-label outcome claims; absolute and relative risk framing required.",
      currencyStatus: "current",
      currentVersion: 1,
      sourceInquiryId: null,
      ownerProfileId: "11111111-1111-4111-8111-111111111111",
      approvedById: "22222222-2222-4222-8222-222222222222",
      approvedAt: T1,
      publishedAt: T1,
      createdAt: T0,
      updatedAt: T1,
    },
    {
      id: itemPendingId,
      slug: "oncology-biomarker-uncertainty-pending",
      title:
        "[SYNTHETIC PENDING] Biomarker-selected oncology evidence uncertainty language",
      questionSummary:
        "What uncertainty language is appropriate when discussing biomarker-selected subgroups in a synthetic oncology teaching scenario?",
      therapeuticArea: "Oncology",
      productName: null,
      indication: null,
      diseaseState: "Solid tumor biomarker subgroup (synthetic)",
      jurisdiction: "US",
      status: "pending_review",
      applicabilityScope: "Teaching draft — not approved for reuse.",
      currencyStatus: "unknown",
      currentVersion: 1,
      sourceInquiryId: null,
      ownerProfileId: "11111111-1111-4111-8111-111111111111",
      approvedById: null,
      approvedAt: null,
      publishedAt: null,
      createdAt: T2,
      updatedAt: T2,
    },
  ];

  const versions: KnowledgeItemVersion[] = [
    {
      id: versionAId,
      knowledgeItemId: itemAId,
      versionNumber: 1,
      answerText:
        "SYNTHETIC APPROVED ANSWER: Distinguish the primary cardiorenal endpoint from secondary endpoints, state the analysis population, and present absolute risk differences alongside relative reductions when discussing labeled outcomes. Do not extrapolate beyond the synthetic labeled indication. If the KOL asks about unstudied populations, state that evidence is insufficient and escalate rather than inventing findings.",
      uncertaintyNotes:
        "Teaching corpus only. Endpoint hierarchy depends on the specific labeled trial narrative used in the demonstration.",
      limitationsNotes:
        "Not a real product response. Not for HCP delivery. No patient-level data.",
      deidentificationNotes:
        "De-identified synthetic scientific content. No real HCP or patient identifiers.",
      createdById: "11111111-1111-4111-8111-111111111111",
      createdAt: T0,
    },
    {
      id: "b12d255e-4bce-58b1-a4a6-e073a825d5f4",
      knowledgeItemId: itemPendingId,
      versionNumber: 1,
      answerText:
        "SYNTHETIC DRAFT: When discussing biomarker-selected oncology subgroups, state selection criteria, sample size limitations, and that multiplicity-adjusted findings may differ from exploratory analyses.",
      uncertaintyNotes: "Pending medical review.",
      limitationsNotes: "Not approved.",
      deidentificationNotes:
        "De-identified synthetic scientific content. No real HCP or patient identifiers.",
      createdById: "11111111-1111-4111-8111-111111111111",
      createdAt: T2,
    },
  ];

  const evidenceLinks: KnowledgeEvidenceLink[] = [
    {
      id: "b297faea-6e09-54a0-aed3-f7c63fa000ac",
      knowledgeItemId: itemAId,
      versionNumber: 1,
      siDocumentId: "si-doc-0001-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      siPassageId: "si-pass-0001-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      evidenceDocumentId: null,
      citationNote:
        "Linked to synthetic SI teaching passage on cardiovascular endpoint framing.",
      createdAt: T0,
    },
  ];

  const matches: KnowledgeMatch[] = [
    {
      id: matchBId,
      inquiryId: null,
      knowledgeItemId: itemAId,
      queryText:
        "A KOL asked about heart and kidney outcomes for our obesity GLP-1 — can I reuse prior approved language on primary vs secondary endpoints?",
      relevanceScore: 86,
      relevanceRationale:
        "Shared concepts: GLP-1, obesity, cardiorenal outcomes, primary vs secondary endpoint framing.",
      matchedConcepts: [
        "GLP-1",
        "cardiorenal",
        "primary endpoint",
        "obesity",
      ],
      applicability: "approved_for_reuse",
      currencyStatus: "current",
      applicabilityWarnings: [
        "Similarity ≠ automatic applicability. Verify labeled indication and audience context before any external use.",
        "Never auto-send to HCPs.",
      ],
      recommendedNextAction:
        "Inspect approved answer + evidence links, verify context, then record accepted reuse or escalate.",
      createdById: "44444444-4444-4444-8444-444444444444",
      createdAt: T3,
    },
  ];

  const reuseEvents: KnowledgeReuseEvent[] = [
    {
      id: "7b0208f4-e221-5b7c-bf33-9508adcc4756",
      knowledgeItemId: itemAId,
      matchId: matchBId,
      inquiryId: null,
      decision: "accepted",
      actorProfileId: "66666666-6666-4666-8666-666666666666",
      verificationNotes:
        "MSL B verified labeled indication alignment and endpoint framing; recorded scoped reuse for internal prep only.",
      adaptationNotes: null,
      searchDurationMs: 42000,
      verificationDurationMs: 380000,
      createdAt: T3,
    },
  ];

  const reviewEvents: KnowledgeReviewEvent[] = [
    {
      id: "aed87c92-f31e-52e3-86c2-9b422b6ce2b3",
      knowledgeItemId: itemAId,
      versionNumber: 1,
      decision: "submitted",
      reviewerProfileId: "11111111-1111-4111-8111-111111111111",
      notes: "Submitted from MI research after MSL A inquiry (synthetic showcase).",
      createdAt: T0,
    },
    {
      id: "1b6fc041-2c0c-597a-8577-9c9cd8584728",
      knowledgeItemId: itemAId,
      versionNumber: 1,
      decision: "approved",
      reviewerProfileId: "22222222-2222-4222-8222-222222222222",
      notes: "Approved for de-identified reusable labeled scientific exchange scope.",
      createdAt: T1,
    },
  ];

  const searchEvents: KnowledgeSearchEvent[] = [
    {
      id: "547e558f-71be-5247-a171-fd9cd2b16b04",
      queryText: "GLP-1 primary cardiorenal endpoint obesity",
      therapeuticArea: "General Medicine",
      productName: "MediMet GLP-1 (synthetic label)",
      resultCount: 1,
      actorProfileId: "66666666-6666-4666-8666-666666666666",
      inquiryId: null,
      durationMs: 42000,
      createdAt: T3,
    },
  ];

  const assumptions: KnowledgeValueAssumptions = {
    id: "505e7f57-d629-5524-97c0-4db0b4ff45e7",
    label: "Default leadership scenario",
    mslWorkforceSize: 50,
    monthlyResearchInquiriesPerMsl: 8,
    eligibleReusePercentage: 0.25,
    netMinutesSavedPerReuse: 45,
    loadedHourlyLaborCost: 150,
    notes:
      "Scenario Estimate inputs only. Not observed employer performance. Deduct verification/adaptation/review effort before claiming net minutes.",
    updatedById: null,
    createdAt: T0,
    updatedAt: T0,
  };

  return {
    items,
    versions,
    evidenceLinks,
    matches,
    reuseEvents,
    reviewEvents,
    searchEvents,
    assumptions,
  };
}

export function getKnowledgeStore(): KnowledgeStore {
  assertSyntheticRuntime();
  if (!globalThis.__medintelKnowledgeStore) {
    globalThis.__medintelKnowledgeStore = createKnowledgeStore();
  }
  return globalThis.__medintelKnowledgeStore;
}

export function resetKnowledgeStore(): void {
  globalThis.__medintelKnowledgeStore = createKnowledgeStore();
}
