import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getKnowledgeStore, resetKnowledgeStore } from "@/lib/demo/knowledge-seed";
import { getDemoStore } from "@/lib/demo/seed";
import { getFieldMedicalStore } from "@/lib/demo/field-medical-seed";
import { getScientificStore } from "@/lib/demo/scientific-evidence-seed";
import { approveKnowledgeItem } from "@/services/knowledge/items";
import { recordKnowledgeReuse } from "@/services/knowledge/reuse";
import { matchApprovedKnowledge } from "@/services/knowledge/matching";
import { authorizeAiGatewayRequest } from "@/lib/security/ai-gateway";
import type { User } from "@/domain/types";

const reviewer: User = { id: "22222222-2222-4222-8222-222222222222", role: "medical_reviewer", email: "reviewer@example.invalid", fullName: "Reviewer", createdAt: "", updatedAt: "" };
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""); resetKnowledgeStore(); });
afterEach(() => vi.unstubAllEnvs());
describe("runtime and scientific safety boundaries", () => {
  it("never serves synthetic stores in configured Supabase mode", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    for (const load of [getKnowledgeStore, getDemoStore, getFieldMedicalStore, getScientificStore]) expect(load).toThrow(/database adapter is unavailable/);
  });
  it("denies live provider authorization even when enterprise mode is requested", async () => {
    vi.stubEnv("MEDINTEL_AI_MODE", "enterprise");
    const result = await authorizeAiGatewayRequest({ agentId: "evidence-analyst", purpose: "test", inputChars: 10, estimatedOutputTokens: 10 });
    expect(result.ok).toBe(false);
  });
  it("excludes pending and outdated items even with broad retrieval filters", () => {
    const store = getKnowledgeStore();
    for (const item of store.items) item.currencyStatus = "outdated";
    expect(matchApprovedKnowledge({ status: "all" }).suggestions).toEqual([]);
    for (const item of store.items) { item.currencyStatus = "current"; item.status = "pending_review"; }
    expect(matchApprovedKnowledge({ status: "pending_review" }).suggestions).toEqual([]);
  });
  it("does not grant applicability from lexical overlap", () => {
    const result = matchApprovedKnowledge({ query: "GLP-1 cardiorenal" });
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every(s => s.applicability !== "approved_for_reuse")).toBe(true);
  });
  it("rejects self-approval", () => {
    const item = getKnowledgeStore().items[0]; item.ownerProfileId = reviewer.id; item.status = "pending_review";
    expect(() => approveKnowledgeItem(item.id, reviewer)).toThrow(/own scientific/);
  });
  it("rejects outdated adaptation and duplicate reuse", () => {
    const item = getKnowledgeStore().items[0]; item.status = "approved"; item.currencyStatus = "outdated";
    const input = { knowledgeItemId: item.id, decision: "adapted" as const, inquiryId: "d1111111-1111-4111-8111-111111111101", verificationNotes: "Scope checked" };
    expect(() => recordKnowledgeReuse(input, reviewer)).toThrow(/approved, current/);
    item.currencyStatus = "current";
    recordKnowledgeReuse(input, reviewer);
    expect(() => recordKnowledgeReuse(input, reviewer)).toThrow(/already been recorded/);
  });
});
