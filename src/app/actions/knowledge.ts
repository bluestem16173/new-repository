"use server";

import { revalidatePath } from "next/cache";
import {
  createKnowledgeItemInputSchema,
  recordReuseInputSchema,
} from "@/domain/knowledge/schemas";
import { recordSecurityAuditEvent } from "@/lib/security/audit";
import { requireUser } from "@/lib/security/require-user";
import {
  approveKnowledgeItem,
  createKnowledgeItemDraft,
  rejectKnowledgeItem,
} from "@/services/knowledge/items";
import { recordKnowledgeReuse } from "@/services/knowledge/reuse";

export async function submitKnowledgeItemAction(
  raw: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser({
      roles: ["admin", "medical_reviewer", "medical_information_specialist"],
      action: "knowledge.create",
      resourceType: "knowledge_item",
    });
    const parsed = createKnowledgeItemInputSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }
    const { item } = createKnowledgeItemDraft(parsed.data, user);
    await recordSecurityAuditEvent({
      actorId: user.id,
      eventType: "knowledge.create",
      resourceType: "knowledge_item",
      resourceId: item.id,
      outcome: "success",
      metadata: { status: item.status },
    });
    revalidatePath("/knowledge");
    revalidatePath("/knowledge/review");
    revalidatePath("/knowledge/search");
    return { ok: true, id: item.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

export async function approveKnowledgeItemAction(
  knowledgeItemId: string,
  notes?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser({
      roles: ["admin", "medical_reviewer"],
      action: "knowledge.approve",
      resourceType: "knowledge_item",
      resourceId: knowledgeItemId,
    });
    approveKnowledgeItem(knowledgeItemId, user, notes);
    await recordSecurityAuditEvent({
      actorId: user.id,
      eventType: "knowledge.approve",
      resourceType: "knowledge_item",
      resourceId: knowledgeItemId,
      outcome: "success",
    });
    revalidatePath("/knowledge");
    revalidatePath("/knowledge/review");
    revalidatePath(`/knowledge/items/${knowledgeItemId}`);
    revalidatePath("/knowledge/analytics");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Approval failed",
    };
  }
}

export async function rejectKnowledgeItemAction(
  knowledgeItemId: string,
  notes?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser({
      roles: ["admin", "medical_reviewer"],
      action: "knowledge.reject",
      resourceType: "knowledge_item",
      resourceId: knowledgeItemId,
    });
    rejectKnowledgeItem(knowledgeItemId, user, notes);
    await recordSecurityAuditEvent({
      actorId: user.id,
      eventType: "knowledge.reject",
      resourceType: "knowledge_item",
      resourceId: knowledgeItemId,
      outcome: "success",
    });
    revalidatePath("/knowledge/review");
    revalidatePath(`/knowledge/items/${knowledgeItemId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Rejection failed",
    };
  }
}

export async function recordKnowledgeReuseAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser({
      action: "knowledge.reuse",
      resourceType: "knowledge_reuse_event",
    });
    const parsed = recordReuseInputSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }
    recordKnowledgeReuse(parsed.data, user);
    await recordSecurityAuditEvent({
      actorId: user.id,
      eventType: "knowledge.reuse",
      resourceType: "knowledge_item",
      resourceId: parsed.data.knowledgeItemId,
      outcome: "success",
      metadata: { decision: parsed.data.decision },
    });
    revalidatePath("/knowledge/analytics");
    revalidatePath(`/knowledge/items/${parsed.data.knowledgeItemId}`);
    if (parsed.data.inquiryId) {
      revalidatePath(`/medical-information/inquiries/${parsed.data.inquiryId}`);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to record reuse",
    };
  }
}
