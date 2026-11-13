import { beforeEach, describe, expect, it } from "vitest";
import { provisionalEvaluationSchema } from "@/domain/scientific/schemas";
import {
  resetScientificStore,
  getScientificStore,
} from "@/lib/demo/scientific-evidence-seed";
import { retrieveEvidence } from "@/services/scientific/retrieval";
import {
  completeSimulationSession,
  evaluateSessionProvisionally,
  startSimulationSession,
  submitMslTurn,
  validateSimulationEvaluation,
} from "@/services/scientific/simulations";
import {
  createInquiryDraftFromEvidence,
  reviewClaim,
} from "@/services/scientific/medical-response";
import { getScientificIntelligenceAnalytics } from "@/services/scientific/analytics";

beforeEach(() => {
  resetScientificStore();
});

describe("evidence retrieval", () => {
  it("returns allowlisted passages with provenance and never invents hits", () => {
    const result = retrieveEvidence({
      query: "cardiovascular endpoints absolute risk",
      limit: 3,
    });
    expect(result.noEvidence).toBe(false);
    expect(result.hits.length).toBeGreaterThan(0);
    for (const hit of result.hits) {
      expect(hit.document.verificationStatus).toBe("illustrative_synthetic");
      expect(hit.passage.content).toMatch(/SYNTHETIC/);
      expect(hit.document.id).toBeTruthy();
      expect(hit.passage.id).toBeTruthy();
    }
  });

  it("returns explicit no-evidence when tokens do not match", () => {
    const result = retrieveEvidence({
      query: "zzzznonexistenttokenxyz",
    });
    expect(result.hits).toEqual([]);
    expect(result.noEvidence).toBe(true);
  });

  it("respects document allowlists for simulations", () => {
    const store = getScientificStore();
    const allowed = [store.documents[1].id];
    const result = retrieveEvidence({
      query: "safety adverse escalate",
      allowedDocumentIds: allowed,
    });
    expect(result.hits.every((h) => allowed.includes(h.document.id))).toBe(
      true,
    );
  });
});

describe("MSL simulation", () => {
  it("persists transcript turns and provisional Zod evaluation", async () => {
    const store = getScientificStore();
    const scenario = store.scenarios[0];
    const session = await startSimulationSession(scenario.id);
    expect(session.turns).toHaveLength(1);
    expect(session.scenarioVersion).toBe(scenario.scenarioVersion);

    const afterReply = await submitMslTurn({
      sessionId: session.id,
      mslMessage:
        "I will cite the allowlisted teaching note on cardiovascular endpoints and state uncertainty where evidence is insufficient.",
    });
    expect(afterReply.turns.length).toBeGreaterThanOrEqual(3);

    const completed = await completeSimulationSession(session.id);
    expect(completed.session.status).toBe("completed");
    const parsed = provisionalEvaluationSchema.parse(completed.evaluation);
    expect(parsed.scientificAccuracy).toBeGreaterThanOrEqual(0);
    expect(completed.evaluationId).toBeTruthy();
  });

  it("flags invented quantitative claims and blocks validation when flagged", async () => {
    const store = getScientificStore();
    const scenario = store.scenarios[0];
    const session = await startSimulationSession(scenario.id);
    await submitMslTurn({
      sessionId: session.id,
      mslMessage: "The hazard ratio of 0.72 with p < 0.001 and 40% reduction proves superiority.",
    });
    const completed = await completeSimulationSession(session.id);
    expect(completed.evaluation.criticalInaccuracyFlags.length).toBeGreaterThan(
      0,
    );
    await expect(
      validateSimulationEvaluation({
        evaluationId: completed.evaluationId!,
        approve: true,
        reviewerName: "Test Reviewer",
      }),
    ).rejects.toThrow(/critical inaccuracy/i);
  });

  it("evaluateSessionProvisionally matches schema", async () => {
    const store = getScientificStore();
    const session = await startSimulationSession(store.scenarios[1].id);
    const evaluation = evaluateSessionProvisionally(session);
    expect(() => provisionalEvaluationSchema.parse(evaluation)).not.toThrow();
  });
});

describe("MI scientific response engine", () => {
  it("creates versioned drafts with claim citations and claim review statuses", async () => {
    const draft = await createInquiryDraftFromEvidence(
      "11111111-1111-4111-8111-111111111111",
      "Please discuss cardiovascular outcomes and absolute risk framing",
    );
    expect(draft.draftVersion).toBe(1);
    expect(draft.claims.length).toBeGreaterThan(0);
    expect(draft.claims.every((c) => c.status === "pending")).toBe(true);
    expect(draft.evidenceDocumentVersions.length).toBeGreaterThan(0);

    const claim = draft.claims[0];
    const reviewed = reviewClaim({
      claimId: claim.id,
      status: "supported",
      reviewerNotes: "Mapped to teaching passage",
      reviewerName: "Dr Reviewer",
    });
    expect(reviewed.status).toBe("supported");
    expect(reviewed.reviewedBy).toBe("Dr Reviewer");
    expect(reviewed.reviewedAt).toBeTruthy();
  });

  it("flags safety-event language for human assessment", async () => {
    const draft = await createInquiryDraftFromEvidence(
      "22222222-2222-4222-8222-222222222222",
      "Patient had a serious adverse event and hospitalization after dosing",
    );
    expect(draft.safetyEventFlag).toBe(true);
  });
});

describe("SI analytics denominators", () => {
  it("returns null rates when denominators are zero", () => {
    const analytics = getScientificIntelligenceAnalytics();
    expect(analytics.fieldMedical.simulationCompletion.value).toBeNull();
    expect(analytics.fieldMedical.simulationCompletion.denominator).toBe(0);
    expect(analytics.medicalInformation.unsupportedClaimRate.value).toBeNull();
    expect(analytics.dataKind).toBe("observed_demo_activity");
  });
});
