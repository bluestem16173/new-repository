import { randomUUID } from "crypto";
import {
  knowledgeMatchAgentResultSchema,
  type KnowledgeMatchAgentResult,
} from "@/domain/knowledge/schemas";
import type {
  KnowledgeCurrencyStatus,
  KnowledgeItem,
  KnowledgeMatchSuggestion,
  KnowledgeSearchFilters,
} from "@/domain/knowledge/types";
import { getKnowledgeStore } from "@/lib/demo/knowledge-seed";
import { getPassageById } from "@/services/scientific/retrieval";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function scoreItem(item: KnowledgeItem, tokens: string[]): {
  score: number;
  concepts: string[];
} {
  const haystack = [
    item.title,
    item.questionSummary,
    item.productName ?? "",
    item.indication ?? "",
    item.diseaseState ?? "",
    item.therapeuticArea,
  ]
    .join(" ")
    .toLowerCase();

  const concepts: string[] = [];
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 1;
      concepts.push(token);
    }
  }
  return { score, concepts: [...new Set(concepts)] };
}

function currencyAllowsSuggestion(status: KnowledgeCurrencyStatus): boolean {
  return status === "current" || status === "aging" || status === "unknown";
}

/**
 * Keyword + structured metadata matcher over approved knowledge.
 * Does not invent publications, approvals, or findings.
 * pgvector semantic matching is deferred until an embedding stack is configured.
 */
export function matchApprovedKnowledge(filters: KnowledgeSearchFilters): {
  suggestions: KnowledgeMatchSuggestion[];
  noSupportedMatch: boolean;
  searchDurationMs: number;
} {
  const store = getKnowledgeStore();
  const tokens = tokenize(filters.query ?? "");
  const limit = filters.limit ?? 8;

  const candidates = store.items.filter((item) => {
    if (item.status !== "approved" || item.currencyStatus !== "current") return false;
    if (filters.status && filters.status !== "all") {
      if (item.status !== filters.status) return false;
    } else if (!filters.status || filters.status === "all") {
      // Default retrieval for reuse suggestions: approved only
      if (!filters.status && item.status !== "approved") return false;
    }
    if (
      filters.therapeuticArea &&
      filters.therapeuticArea !== "all" &&
      item.therapeuticArea.toLowerCase() !==
        filters.therapeuticArea.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.productName &&
      !(item.productName ?? "")
        .toLowerCase()
        .includes(filters.productName.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.diseaseState &&
      !(item.diseaseState ?? "")
        .toLowerCase()
        .includes(filters.diseaseState.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.currencyStatus &&
      filters.currencyStatus !== "all" &&
      item.currencyStatus !== filters.currencyStatus
    ) {
      return false;
    }
    return true;
  });

  const scored = candidates
    .map((item) => {
      const { score, concepts } = scoreItem(item, tokens);
      return { item, score, concepts };
    })
    .filter((row) => (tokens.length === 0 ? true : row.score > 0))
    .sort(
      (a, b) =>
        b.score - a.score || a.item.title.localeCompare(b.item.title),
    )
    .slice(0, limit);

  const suggestions: KnowledgeMatchSuggestion[] = scored.map((row) => {
    const links = store.evidenceLinks.filter(
      (link) =>
        link.knowledgeItemId === row.item.id &&
        link.versionNumber === row.item.currentVersion,
    );
    const evidenceIdentifiers = links
      .map((link) => {
        if (link.siPassageId) {
          const hit = getPassageById(link.siPassageId);
          if (hit?.document.doi) return `DOI:${hit.document.doi}`;
          if (hit?.document.pmid) return `PMID:${hit.document.pmid}`;
          return `si-doc:${link.siDocumentId ?? hit?.document.id ?? "unknown"}`;
        }
        if (link.evidenceDocumentId) return `evidence:${link.evidenceDocumentId}`;
        return null;
      })
      .filter((value): value is string => Boolean(value));

    const outdated = row.item.currencyStatus === "outdated";
    const applicability = outdated
      ? "similar_not_applicable"
      : "requires_adaptation";

    const warnings = [
      "Similarity is not the same as approved applicability.",
      "Human context verification is required before any external scientific use.",
      "Never automatically send scientific responses to HCPs.",
    ];
    if (outdated) {
      warnings.push("Evidence currency is outdated — do not reuse without re-review.");
    }
    if (!currencyAllowsSuggestion(row.item.currencyStatus) && !outdated) {
      warnings.push("Currency status requires specialist confirmation.");
    }

    return {
      knowledgeItemId: row.item.id,
      relevanceRationale:
        row.concepts.length > 0
          ? `Matched scientific terms: ${row.concepts.join(", ")}.`
          : "Listed by metadata filters without strong lexical overlap.",
      matchedScientificConcepts: row.concepts,
      evidenceIdentifiers,
      applicabilityWarnings: warnings,
      currencyStatus: row.item.currencyStatus,
      applicability,
      recommendedNextAction: outdated
        ? "Escalate for evidence re-review; do not treat as reusable."
        : "Inspect approved answer, verify labeled scope, then record accept/adapt/reject/escalate.",
      relevanceScore: Math.min(100, row.score * 28 + (row.item.status === "approved" ? 10 : 0)),
      item: row.item,
    };
  });

  return {
    suggestions,
    noSupportedMatch: suggestions.length === 0,
    // Deterministic in SSR/demo; wall-clock timing recorded only when clients supply it on reuse events.
    searchDurationMs: 0,
  };
}

/** Structured agent-facing result — Zod validated, never invents matches. */
export function runKnowledgeMatchingAgent(params: {
  query: string;
  therapeuticArea?: string;
  productName?: string;
  inquiryId?: string | null;
  actorProfileId?: string | null;
}): KnowledgeMatchAgentResult {
  const { suggestions, noSupportedMatch, searchDurationMs } =
    matchApprovedKnowledge({
      query: params.query,
      therapeuticArea: params.therapeuticArea,
      productName: params.productName,
      status: "approved",
      limit: 5,
    });

  const store = getKnowledgeStore();
  store.searchEvents.unshift({
    id: randomUUID(),
    queryText: params.query,
    therapeuticArea: params.therapeuticArea ?? null,
    productName: params.productName ?? null,
    resultCount: suggestions.length,
    actorProfileId: params.actorProfileId ?? null,
    inquiryId: params.inquiryId ?? null,
    durationMs: searchDurationMs,
    createdAt: new Date().toISOString(),
  });

  const top = suggestions[0];
  if (!top || noSupportedMatch) {
    return knowledgeMatchAgentResultSchema.parse({
      knowledge_item_id: null,
      relevance_rationale:
        "No approved knowledge item met keyword and metadata filters for this query.",
      matched_scientific_concepts: [],
      evidence_identifiers: [],
      applicability_warnings: [
        "Explicit no-supported-match. Route to evidence retrieval and Medical Information workflow.",
      ],
      currency_status: "unknown",
      recommended_next_action:
        "Use Evidence Library + Medical Information draft/review path; do not invent citations.",
      no_supported_match: true,
      relevance_score: null,
      applicability: null,
    });
  }

  const matchId = randomUUID();
  store.matches.unshift({
    id: matchId,
    inquiryId: params.inquiryId ?? null,
    knowledgeItemId: top.knowledgeItemId,
    queryText: params.query,
    relevanceScore: top.relevanceScore,
    relevanceRationale: top.relevanceRationale,
    matchedConcepts: top.matchedScientificConcepts,
    applicability: top.applicability,
    currencyStatus: top.currencyStatus,
    applicabilityWarnings: top.applicabilityWarnings,
    recommendedNextAction: top.recommendedNextAction,
    createdById: params.actorProfileId ?? null,
    createdAt: new Date().toISOString(),
  });

  return knowledgeMatchAgentResultSchema.parse({
    knowledge_item_id: top.knowledgeItemId,
    relevance_rationale: top.relevanceRationale,
    matched_scientific_concepts: top.matchedScientificConcepts,
    evidence_identifiers: top.evidenceIdentifiers,
    applicability_warnings: top.applicabilityWarnings,
    currency_status: top.currencyStatus,
    recommended_next_action: top.recommendedNextAction,
    no_supported_match: false,
    relevance_score: top.relevanceScore,
    applicability: top.applicability,
  });
}
