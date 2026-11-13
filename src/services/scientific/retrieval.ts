import { randomUUID } from "crypto";
import type {
  RetrievalHit,
  RetrievalResult,
} from "@/domain/scientific/types";
import { getScientificStore } from "@/lib/demo/scientific-evidence-seed";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

/**
 * Keyword/full-text style retrieval over allowlisted passages.
 * Never invents passages. Returns explicit no-evidence when nothing matches.
 */
export function retrieveEvidence(params: {
  query: string;
  allowedDocumentIds?: string[];
  limit?: number;
}): RetrievalResult {
  const store = getScientificStore();
  const tokens = tokenize(params.query);
  const limit = params.limit ?? 5;
  const allow = params.allowedDocumentIds
    ? new Set(params.allowedDocumentIds)
    : null;

  const docs = new Map(store.documents.map((d) => [d.id, d]));
  const scored: RetrievalHit[] = [];

  for (const passage of store.passages) {
    if (allow && !allow.has(passage.documentId)) continue;
    const document = docs.get(passage.documentId);
    if (!document) continue;
    if (document.verificationStatus === "rejected") continue;

    const haystack = `${document.title} ${passage.sectionLabel ?? ""} ${passage.content}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    if (score === 0) continue;
    scored.push({
      document,
      passage,
      rankScore: score,
    });
  }

  scored.sort(
    (a, b) =>
      b.rankScore - a.rankScore ||
      a.passage.passageKey.localeCompare(b.passage.passageKey),
  );

  const hits = scored.slice(0, limit);
  return {
    query: params.query,
    hits,
    noEvidence: hits.length === 0,
    runId: randomUUID(),
  };
}

export function getPassageById(passageId: string) {
  const store = getScientificStore();
  const passage = store.passages.find((p) => p.id === passageId);
  if (!passage) return null;
  const document = store.documents.find((d) => d.id === passage.documentId);
  if (!document) return null;
  return { passage, document };
}

export function listScientificDocuments() {
  return [...getScientificStore().documents];
}

export function listScientificPassages(documentId?: string) {
  const passages = getScientificStore().passages;
  return documentId
    ? passages.filter((p) => p.documentId === documentId)
    : [...passages];
}
