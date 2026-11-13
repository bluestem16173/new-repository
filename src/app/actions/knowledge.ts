"use server";

import { revalidatePath } from "next/cache";
import {
  createKnowledgeItemInputSchema,
  recordReuseInputSchema,
} from "@/domain/knowledge/schemas";
import { getCurrentUser } from "@/lib/session";
import {
  approveKnowledgeItem,
  createKnowledgeItemDraft,
  rejectKnowledgeItem,
} from "@/services/knowledge/items";
import { recordKnowledgeReuse } from "@/services/knowledge/reuse";

export async function submitKnowledgeItemAction(
  raw: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  const parsed = createKnowledgeItemInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const { item } = createKnowledgeItemDraft(parsed.data, user);
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
  const user = await getCurrentUser();
  try {
    approveKnowledgeItem(knowledgeItemId, user, notes);
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
  const user = await getCurrentUser();
  try {
    rejectKnowledgeItem(knowledgeItemId, user, notes);
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
  const user = await getCurrentUser();
  const parsed = recordReuseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    recordKnowledgeReuse(parsed.data, user);
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
