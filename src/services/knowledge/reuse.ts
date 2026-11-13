import { getDemoStore } from "@/lib/demo/seed";
import { randomUUID } from "crypto";
import { canRecordKnowledgeReuse } from "@/domain/knowledge/authorization";
import type { RecordReuseInput } from "@/domain/knowledge/schemas";
import type { KnowledgeReuseEvent } from "@/domain/knowledge/types";
import type { User } from "@/domain/types";
import { getKnowledgeStore } from "@/lib/demo/knowledge-seed";
import { getKnowledgeItemById } from "@/services/knowledge/items";

export function listReuseEvents(knowledgeItemId?: string): KnowledgeReuseEvent[] {
  return getKnowledgeStore()
    .reuseEvents.filter((event) =>
      knowledgeItemId ? event.knowledgeItemId === knowledgeItemId : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordKnowledgeReuse(
  input: RecordReuseInput,
  user: User,
): KnowledgeReuseEvent {
  if (!canRecordKnowledgeReuse(user.role)) {
    throw new Error("Not authorized to record knowledge reuse.");
  }
  const item = getKnowledgeItemById(input.knowledgeItemId);
  if (!item) throw new Error("Knowledge item not found.");
  if (item.status !== "approved" && input.decision === "accepted") {
    throw new Error("Only approved knowledge items can be accepted for reuse.");
  }

  if (input.decision === "accepted" || input.decision === "adapted") {
    if (item.status !== "approved" || item.currencyStatus !== "current") {
      throw new Error("Reuse requires approved, current knowledge.");
    }
    if (!input.inquiryId || !input.verificationNotes?.trim()) {
      throw new Error("An inquiry and applicability verification notes are required for reuse.");
    }
    const existing = getKnowledgeStore().reuseEvents.find((event) =>
      event.inquiryId === input.inquiryId && event.knowledgeItemId === item.id &&
      (event.decision === "accepted" || event.decision === "adapted"));
    if (existing) throw new Error("Reuse has already been recorded for this inquiry and knowledge item.");
  }

  if (input.inquiryId) {
    const inquiry = getDemoStore().inquiries.find(row => row.id === input.inquiryId);
    if (!inquiry || (user.role === "msl" && inquiry.createdById !== user.id && inquiry.assignedToId !== user.id)) {
      throw new Error("Inquiry not found or access denied.");
    }
  }
  if (input.matchId) {
    const match = getKnowledgeStore().matches.find(row => row.id === input.matchId);
    if (!match || match.knowledgeItemId !== item.id || match.inquiryId !== (input.inquiryId ?? null)) {
      throw new Error("Match does not belong to this inquiry and knowledge item.");
    }
  }

  const event: KnowledgeReuseEvent = {
    id: randomUUID(),
    knowledgeItemId: input.knowledgeItemId,
    matchId: input.matchId ?? null,
    inquiryId: input.inquiryId ?? null,
    decision: input.decision,
    actorProfileId: user.id,
    verificationNotes: input.verificationNotes ?? null,
    adaptationNotes: input.adaptationNotes ?? null,
    searchDurationMs: input.searchDurationMs ?? null,
    verificationDurationMs: input.verificationDurationMs ?? null,
    createdAt: new Date().toISOString(),
  };

  getKnowledgeStore().reuseEvents.unshift(event);
  return event;
}
