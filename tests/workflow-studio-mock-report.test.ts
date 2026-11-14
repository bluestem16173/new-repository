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
    expect(context.toLowerCase()).toMatch(/illustrative|synthetic|fictional/);
    expect(context).not.toMatch(/10\.\d{4}\/\S+/); // no real DOI patterns invented here
  });

  it("composes a fixture mock report with oversight labeling", () => {
    const report = composeFixtureMockReport("manager-education");
    expect(report.source).toBe("fixture_compose");
    expect(report.body).toContain("Illustrative Demo");
    expect(report.oversightLabel.toLowerCase()).toContain("oversight");
    expect(report.title.toLowerCase()).toContain("education");
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

  it("generates via OpenAI when key present and fetch succeeds", async () => {
    vi.stubEnv("OPENAI_API_Key", "sk-test-not-logged");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "# Illustrative Demo Data\nSynthetic KOL briefing from allowlisted fixtures only.",
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
    expect(report.body).toContain("Provider generation was unavailable");
  });
});
