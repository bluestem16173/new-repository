import { randomUUID } from "crypto";
import type { ResponseDraft } from "@/domain/scientific/types";
import { getScientificStore } from "@/lib/demo/scientific-evidence-seed";
import { retrieveEvidence } from "@/services/scientific/retrieval";

const SAFETY_PATTERN =
  /adverse event|serious adverse|hospitaliz|death|anaphylax|suicid/i;

/**
 * Builds a provisional MI draft from retrieved allowlisted passages only.
 * Never auto-approves or externally releases. OpenAI is not required for demo.
 */
export async function createInquiryDraftFromEvidence(
  inquiryId: string,
  questionText: string,
): Promise<ResponseDraft> {
  const store = getScientificStore();
  const retrieval = retrieveEvidence({ query: questionText, limit: 4 });
  const safetyEventFlag = SAFETY_PATTERN.test(questionText);

  const existing = store.drafts.filter((d) => d.inquiryId === inquiryId);
  const draftVersion =
    existing.reduce((max, d) => Math.max(max, d.draftVersion), 0) + 1;

  const evidenceDocumentVersions = [
    ...new Map(
      retrieval.hits.map((h) => [
        h.document.id,
        { documentId: h.document.id, version: h.document.version },
      ]),
    ).values(),
  ];

  const claims = retrieval.hits.map((hit, index) => ({
    id: randomUUID(),
    draftId: "pending",
    claimKey: `claim-${index + 1}`,
    claimText: `Based on teaching passage ${hit.passage.passageKey}: ${hit.passage.content}`,
    citationPassageIds: [hit.passage.id],
    status: "pending" as const,
    reviewerNotes: null,
    reviewedBy: null,
    reviewedAt: null,
  }));

  const draftText = retrieval.noEvidence
    ? "No allowlisted evidence passages matched this inquiry. A human Medical Information specialist should confirm whether additional verified sources are required. This draft is not approved for release."
    : [
        "Provisional Medical Information draft (demo).",
        "Claims below are mapped to allowlisted synthetic teaching passages only.",
        "",
        ...claims.map(
          (c, i) => `${i + 1}. ${c.claimText}`,
        ),
        "",
        "This content is not auto-approved and must not be released without medical review.",
      ].join("\n");

  const draft: ResponseDraft = {
    id: randomUUID(),
    inquiryId,
    draftVersion,
    evidenceDocumentVersions,
    draftText,
    uncertaintyNotes: retrieval.noEvidence
      ? "No evidence hits for query tokens."
      : "Retrieved content is untrusted until medical review.",
    limitationsNotes:
      "Demo corpus is illustrative/synthetic. Not real publications.",
    missingEvidenceNotes: retrieval.noEvidence
      ? "Explicit no-evidence result."
      : null,
    safetyEventFlag,
    createdByRole: "system_demo",
    createdAt: new Date().toISOString(),
    claims: [],
  };

  draft.claims = claims.map((c) => ({ ...c, draftId: draft.id }));
  store.drafts.unshift(draft);
  return draft;
}

export function getDraftsForInquiry(inquiryId: string): ResponseDraft[] {
  return getScientificStore()
    .drafts.filter((d) => d.inquiryId === inquiryId)
    .sort((a, b) => b.draftVersion - a.draftVersion);
}

export function reviewClaim(params: {
  claimId: string;
  status: "pending" | "supported" | "needs_revision" | "unsupported";
  reviewerNotes?: string | null;
  reviewerName: string;
}) {
  const store = getScientificStore();
  for (const draft of store.drafts) {
    const claim = draft.claims.find((c) => c.id === params.claimId);
    if (!claim) continue;
    claim.status = params.status;
    claim.reviewerNotes = params.reviewerNotes ?? null;
    claim.reviewedBy = params.reviewerName;
    claim.reviewedAt = new Date().toISOString();
    return claim;
  }
  throw new Error("Claim not found");
}
