import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateScenarioCapacity,
  knowledgeMatchAgentResultSchema,
} from "@/domain/knowledge/schemas";
import {
  canApproveKnowledgeItem,
  canCreateKnowledgeItem,
} from "@/domain/knowledge/authorization";
import { resetKnowledgeStore } from "@/lib/demo/knowledge-seed";
import {
  approveKnowledgeItem,
  createKnowledgeItemDraft,
  listKnowledgeItems,
  searchKnowledgeLibrary,
} from "@/services/knowledge/items";
import {
  matchApprovedKnowledge,
  runKnowledgeMatchingAgent,
} from "@/services/knowledge/matching";
import { recordKnowledgeReuse } from "@/services/knowledge/reuse";
import { getKnowledgeAnalytics } from "@/services/knowledge/analytics";
import type { User } from "@/domain/types";

const reviewer: User = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "jordan.lee@demo.medintel.local",
  fullName: "Jordan Lee",
  role: "medical_reviewer",
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

const msl: User = {
  id: "66666666-6666-4666-8666-666666666666",
  email: "taylor.brooks@demo.medintel.local",
  fullName: "Taylor Brooks",
  role: "msl",
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

const specialist: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "alex.chen@demo.medintel.local",
  fullName: "Alex Chen",
  role: "medical_information_specialist",
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

describe("Scientific Knowledge Network", () => {
  beforeEach(() => {
    resetKnowledgeStore();
  });

  it("matches approved GLP-1 cardiorenal knowledge for similar wording", () => {
    const { suggestions, noSupportedMatch } = matchApprovedKnowledge({
      query:
        "KOL asked about heart and kidney outcomes for obesity GLP-1 primary endpoint framing",
      therapeuticArea: "General Medicine",
      status: "approved",
    });
    expect(noSupportedMatch).toBe(false);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].item.slug).toBe(
      "cardiorenal-endpoint-framing-glp1",
    );
    expect(suggestions[0].applicabilityWarnings.length).toBeGreaterThan(0);
  });

  it("returns explicit no-supported-match for unrelated queries", () => {
    const result = runKnowledgeMatchingAgent({
      query: "xyzzy unrelated quantum pineapple protocol",
      actorProfileId: msl.id,
    });
    const parsed = knowledgeMatchAgentResultSchema.parse(result);
    expect(parsed.no_supported_match).toBe(true);
    expect(parsed.knowledge_item_id).toBeNull();
  });

  it("enforces create vs approve authorization", () => {
    expect(canCreateKnowledgeItem(specialist.role)).toBe(true);
    expect(canCreateKnowledgeItem(msl.role)).toBe(false);
    expect(canApproveKnowledgeItem(reviewer.role)).toBe(true);
    expect(canApproveKnowledgeItem(specialist.role)).toBe(false);
  });

  it("supports capture → approve → reuse showcase transitions", () => {
    const { item } = createKnowledgeItemDraft(
      {
        title: "[SYNTHETIC] Reuse capture test item for endpoint discipline",
        questionSummary:
          "How should absolute versus relative risk be framed for a labeled metabolic outcome discussion?",
        answerText:
          "SYNTHETIC: Present absolute risk differences with relative reductions and state the analysis population. Do not invent trial statistics.",
        therapeuticArea: "General Medicine",
        productName: "MediMet GLP-1 (synthetic label)",
        indication: "Adult obesity (synthetic)",
        diseaseState: "Obesity",
        jurisdiction: "US",
        applicabilityScope: "Labeled exchange only",
        currencyStatus: "current",
        siPassageIds: ["si-pass-0001-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        evidenceDocumentIds: [],
      },
      specialist,
    );
    expect(item.status).toBe("pending_review");
    const approved = approveKnowledgeItem(item.id, reviewer);
    expect(approved.status).toBe("approved");
    const reuse = recordKnowledgeReuse(
      {
        knowledgeItemId: item.id,
        decision: "accepted",
        verificationNotes: "Verified labeled scope for internal prep.",
      },
      msl,
    );
    expect(reuse.decision).toBe("accepted");
    expect(
      listKnowledgeItems({ status: "approved" }).some((row) => row.id === item.id),
    ).toBe(true);
  });

  it("calculates scenario capacity with documented formula", () => {
    const scenario = calculateScenarioCapacity({
      mslWorkforceSize: 50,
      monthlyResearchInquiriesPerMsl: 8,
      eligibleReusePercentage: 0.25,
      netMinutesSavedPerReuse: 45,
      loadedHourlyLaborCost: 150,
    });
    expect(scenario.monthlyNetHoursRecovered).toBeCloseTo(75);
    expect(scenario.monthlyEquivalentCapacityValue).toBeCloseTo(11250);
    expect(scenario.label).toBe("Scenario Estimate");
  });

  it("analytics separates validated reuse from search and cash N/A", () => {
    const analytics = getKnowledgeAnalytics();
    expect(analytics.kpis.validatedKnowledgeReuseEvents.value).toBeGreaterThan(
      0,
    );
    expect(analytics.kpis.actualRealizedCashSavings.value).toBeNull();
    expect(analytics.kpis.estimatedNetResearchHoursRecovered.label).toBe(
      "Scenario Estimate",
    );
    expect(searchKnowledgeLibrary({ status: "approved" }).items.length).toBeGreaterThan(
      0,
    );
  });
});
