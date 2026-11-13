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
