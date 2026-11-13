import { randomUUID } from "crypto";
import {
  canApproveKnowledgeItem,
  canCreateKnowledgeItem,
} from "@/domain/knowledge/authorization";
import type { CreateKnowledgeItemInput } from "@/domain/knowledge/schemas";
import type {
  KnowledgeEvidenceLink,
  KnowledgeItem,
  KnowledgeItemVersion,
  KnowledgeReviewEvent,
} from "@/domain/knowledge/types";
import type { User } from "@/domain/types";
import { getKnowledgeStore } from "@/lib/demo/knowledge-seed";
import { getPassageById } from "@/services/scientific/retrieval";
import { matchApprovedKnowledge } from "@/services/knowledge/matching";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function listKnowledgeItems(options?: {
  status?: KnowledgeItem["status"] | "all";
  includeNonApproved?: boolean;
}): KnowledgeItem[] {
  const store = getKnowledgeStore();
  return store.items
    .filter((item) => {
      if (options?.status && options.status !== "all") {
        return item.status === options.status;
      }
      if (options?.includeNonApproved) return true;
      return item.status === "approved";
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getKnowledgeItemById(id: string): KnowledgeItem | null {
  return getKnowledgeStore().items.find((item) => item.id === id) ?? null;
}

export function getKnowledgeItemBySlug(slug: string): KnowledgeItem | null {
  return getKnowledgeStore().items.find((item) => item.slug === slug) ?? null;
}

export function getKnowledgeVersions(
  knowledgeItemId: string,
): KnowledgeItemVersion[] {
  return getKnowledgeStore()
    .versions.filter((version) => version.knowledgeItemId === knowledgeItemId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export function getCurrentVersion(
  item: KnowledgeItem,
): KnowledgeItemVersion | null {
  return (
    getKnowledgeStore().versions.find(
      (version) =>
        version.knowledgeItemId === item.id &&
        version.versionNumber === item.currentVersion,
    ) ?? null
  );
}

export function getEvidenceLinksForItem(
  knowledgeItemId: string,
  versionNumber?: number,
): KnowledgeEvidenceLink[] {
  return getKnowledgeStore().evidenceLinks.filter(
    (link) =>
      link.knowledgeItemId === knowledgeItemId &&
      (versionNumber === undefined || link.versionNumber === versionNumber),
  );
}

export function getReviewEvents(
  knowledgeItemId: string,
): KnowledgeReviewEvent[] {
  return getKnowledgeStore()
    .reviewEvents.filter((event) => event.knowledgeItemId === knowledgeItemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function searchKnowledgeLibrary(params: {
  query?: string;
  therapeuticArea?: string;
  productName?: string;
  status?: KnowledgeItem["status"] | "all";
  currencyStatus?: KnowledgeItem["currencyStatus"] | "all";
}) {
  const status =
    params.status ??
    ("approved" as const);
  const { suggestions, noSupportedMatch, searchDurationMs } =
    matchApprovedKnowledge({
      query: params.query,
      therapeuticArea: params.therapeuticArea,
      productName: params.productName,
      status,
      currencyStatus: params.currencyStatus,
      limit: 25,
    });

  // When browsing without a query and status all/pending, fall back to list
  if (!params.query?.trim() && status !== "approved") {
    return {
      items: listKnowledgeItems({ status, includeNonApproved: true }),
      suggestions: [],
      noSupportedMatch: false,
      searchDurationMs,
    };
  }

  if (!params.query?.trim() && status === "approved") {
    return {
      items: listKnowledgeItems({ status: "approved" }),
      suggestions: [],
      noSupportedMatch: false,
      searchDurationMs,
    };
  }

  return {
    items: suggestions.map((suggestion) => suggestion.item),
    suggestions,
    noSupportedMatch,
    searchDurationMs,
  };
}

export function createKnowledgeItemDraft(
  input: CreateKnowledgeItemInput,
  user: User,
): { item: KnowledgeItem; version: KnowledgeItemVersion } {
  if (!canCreateKnowledgeItem(user.role)) {
    throw new Error("Not authorized to create knowledge items.");
  }

  const store = getKnowledgeStore();
  const now = new Date().toISOString();
  const id = randomUUID();
  const baseSlug = slugify(input.title) || `knowledge-${id.slice(0, 8)}`;
  const slug =
    store.items.some((item) => item.slug === baseSlug)
      ? `${baseSlug}-${id.slice(0, 6)}`
      : baseSlug;

  const item: KnowledgeItem = {
    id,
    slug,
    title: input.title,
    questionSummary: input.questionSummary,
    therapeuticArea: input.therapeuticArea,
    productName: input.productName ?? null,
    indication: input.indication ?? null,
    diseaseState: input.diseaseState ?? null,
    jurisdiction: input.jurisdiction,
    status: "pending_review",
    applicabilityScope: input.applicabilityScope,
    currencyStatus: input.currencyStatus,
    currentVersion: 1,
    sourceInquiryId: input.sourceInquiryId ?? null,
    ownerProfileId: user.id,
    approvedById: null,
    approvedAt: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const version: KnowledgeItemVersion = {
    id: randomUUID(),
    knowledgeItemId: id,
    versionNumber: 1,
    answerText: input.answerText,
    uncertaintyNotes: input.uncertaintyNotes ?? null,
    limitationsNotes: input.limitationsNotes ?? null,
    deidentificationNotes:
      "De-identified synthetic/demo scientific content. No real HCP or patient identifiers.",
    createdById: user.id,
    createdAt: now,
  };

  const links: KnowledgeEvidenceLink[] = [];
  for (const passageId of input.siPassageIds) {
    const hit = getPassageById(passageId);
    links.push({
      id: randomUUID(),
      knowledgeItemId: id,
      versionNumber: 1,
      siDocumentId: hit?.document.id ?? null,
      siPassageId: passageId,
      evidenceDocumentId: null,
      citationNote: hit
        ? `Linked SI passage ${hit.passage.passageKey}`
        : "Passage id recorded; document not found in allowlist.",
      createdAt: now,
    });
  }
  for (const evidenceDocumentId of input.evidenceDocumentIds) {
    links.push({
      id: randomUUID(),
      knowledgeItemId: id,
      versionNumber: 1,
      siDocumentId: null,
      siPassageId: null,
      evidenceDocumentId,
      citationNote: "Linked Medical Information evidence document.",
      createdAt: now,
    });
  }

  store.items.unshift(item);
  store.versions.unshift(version);
  store.evidenceLinks.unshift(...links);
  store.reviewEvents.unshift({
    id: randomUUID(),
    knowledgeItemId: id,
    versionNumber: 1,
    decision: "submitted",
    reviewerProfileId: user.id,
    notes: "Submitted for authorized knowledge approval.",
    createdAt: now,
  });

  return { item, version };
}

export function approveKnowledgeItem(
  knowledgeItemId: string,
  user: User,
  notes?: string,
): KnowledgeItem {
  if (!canApproveKnowledgeItem(user.role)) {
    throw new Error("Not authorized to approve knowledge items.");
  }
  const store = getKnowledgeStore();
  const item = store.items.find((row) => row.id === knowledgeItemId);
  if (!item) throw new Error("Knowledge item not found.");
  if (item.status === "approved") return item;

  const now = new Date().toISOString();
  item.status = "approved";
  item.approvedById = user.id;
  item.approvedAt = now;
  item.publishedAt = now;
  item.updatedAt = now;
  if (item.currencyStatus === "unknown") item.currencyStatus = "current";

  store.reviewEvents.unshift({
    id: randomUUID(),
    knowledgeItemId: item.id,
    versionNumber: item.currentVersion,
    decision: "approved",
    reviewerProfileId: user.id,
    notes: notes ?? "Approved for scoped, de-identified reuse after verification.",
    createdAt: now,
  });

  return item;
}

export function rejectKnowledgeItem(
  knowledgeItemId: string,
  user: User,
  notes?: string,
): KnowledgeItem {
  if (!canApproveKnowledgeItem(user.role)) {
    throw new Error("Not authorized to reject knowledge items.");
  }
  const store = getKnowledgeStore();
  const item = store.items.find((row) => row.id === knowledgeItemId);
  if (!item) throw new Error("Knowledge item not found.");
  const now = new Date().toISOString();
  item.status = "rejected";
  item.updatedAt = now;
  store.reviewEvents.unshift({
    id: randomUUID(),
    knowledgeItemId: item.id,
    versionNumber: item.currentVersion,
    decision: "rejected",
    reviewerProfileId: user.id,
    notes: notes ?? "Rejected — not published for reuse.",
    createdAt: now,
  });
  return item;
}
