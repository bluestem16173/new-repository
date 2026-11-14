import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAllowlistedReportContext,
  composeFixtureMockReport,
  generateWorkflowStudioMockReport,
} from "@/services/workflow-studio/mock-report";
import { authorizeAiGatewayRequest } from "@/lib/security/ai-gateway";
import { hasOpenAiApiKey } from "@/lib/security/openai-env";
import type { User } from "@/domain/types";

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "msl",
  email: "msl@demo.medintel.local",
  fullName: "Demo MSL",
  createdAt: "",
  updatedAt: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("workflow studio mock reports", () => {
  it("builds allowlisted context from fixtures without inventing real DOIs", () => {
    const context = buildAllowlistedReportContext("kol-meeting-prep");
    expect(context).toContain("KOL Meeting Prep");
    expect(context).toContain("Literature Scout");
    expect(context).toContain("visit-context");
    expect(context.toLowerCase()).toMatch(/illustrative|synthetic|fictional/);
    expect(context).not.toMatch(/10\.\d{4}\/\S+/);
  });

  it("composes structured fixture sections with agent ownership", () => {
    const report = composeFixtureMockReport("manager-education");
    expect(report.source).toBe("fixture_compose");
    expect(report.sections.length).toBeGreaterThanOrEqual(6);
    expect(report.sections.every((section) => section.agentIds.length > 0)).toBe(
      true,
    );
    expect(report.body).toContain("Illustrative Demo");
    expect(report.oversightLabel.toLowerCase()).toContain("oversight");
    expect(report.title.toLowerCase()).toContain("education");
    expect(report.sections.some((section) => section.id === "coaching-plan")).toBe(
      true,
    );
  });

  it("reads either OPENAI_API_KEY or OPENAI_API_Key without exposing values", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_API_Key", "sk-test-not-logged");
    expect(hasOpenAiApiKey()).toBe(true);
    vi.stubEnv("OPENAI_API_Key", "");
    expect(hasOpenAiApiKey()).toBe(false);
  });

  it("authorizes workflow mock report purpose for openai model when key present", async () => {
    vi.stubEnv("OPENAI_API_Key", "sk-test-not-logged");
    const result = await authorizeAiGatewayRequest({
      agentId: "workflow-studio-mock-report",
      purpose: "workflow_studio_mock_report",
      inputChars: 200,
      estimatedOutputTokens: 100,
      model: "openai:gpt-4.1-mini",
      userId: user.id,
    });
    expect(result.ok).toBe(true);
  });

  it("generates via OpenAI structured JSON when key present and fetch succeeds", async () => {
    vi.stubEnv("OPENAI_API_Key", "sk-test-not-logged");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Illustrative KOL Meeting Prep Report (demo AI)",
                  summary:
                    "Synthetic KOL briefing from allowlisted fixtures only.",
                  sections: [
                    {
                      id: "visit-context",
                      body: "Visit context from fixtures.",
                      agentIds: ["medical-drafting", "literature-scout"],
                    },
                    {
                      id: "background",
                      body: "Background from fixtures.",
                      agentIds: ["literature-scout", "evidence-analyst"],
                    },
                    {
                      id: "key-evidence",
                      body: "Key evidence from fixtures.",
                      agentIds: ["evidence-analyst", "literature-scout"],
                    },
                    {
                      id: "talking-points",
                      body: "Talking points from fixtures.",
                      agentIds: ["knowledge-matcher", "medical-drafting"],
                    },
                    {
                      id: "anticipated-questions",
                      body: "Questions from fixtures.",
                      agentIds: ["kol-simulator"],
                    },
                    {
                      id: "protocol-insights",
                      body: "Protocol insights from fixtures.",
                      agentIds: ["protocol-intelligence"],
                    },
                    {
                      id: "open-items",
                      body: "Open items from fixtures.",
                      agentIds: ["medical-drafting", "case-completeness"],
                    },
                    {
                      id: "prep-actions",
                      body: "Prep actions from fixtures.",
                      agentIds: ["medical-drafting", "coaching-advisor"],
                    },
                  ],
                }),
              },
            },
          ],
        }),
      })),
    );

    const report = await generateWorkflowStudioMockReport({
      workflowId: "kol-meeting-prep",
      user,
    });
    expect(report.source).toBe("openai");
    expect(report.sections).toHaveLength(8);
    expect(report.sections[0]?.agentIds).toContain("literature-scout");
    expect(report.body).toContain("Illustrative Demo");
    expect(report.oversightLabel).toContain("oversight");
  });

  it("falls back to fixture compose when OpenAI fetch fails", async () => {
    vi.stubEnv("OPENAI_API_Key", "sk-test-not-logged");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })),
    );

    const report = await generateWorkflowStudioMockReport({
      workflowId: "manager-education",
      user,
    });
    expect(report.source).toBe("fixture_compose");
    expect(report.summary).toContain("Provider generation was unavailable");
    expect(report.sections.length).toBeGreaterThan(0);
  });
});
