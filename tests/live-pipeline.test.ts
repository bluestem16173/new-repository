import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildLivePipelineRun,
  progressPercent,
  stageDefsFor,
} from "@/domain/data-room/live-pipeline";
import {
  LivePipelineStageError,
  runLivePipelineStage,
} from "@/services/data-room/live-pipeline";
import { clearLivePipelineRuns } from "@/services/data-room/live-pipeline-store";
import type { User } from "@/domain/types";

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "msl",
  email: "alex.chen@demo.medintel.local",
  fullName: "Alex Chen",
  createdAt: "",
  updatedAt: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  clearLivePipelineRuns();
});

describe("live staged pipeline", () => {
  it("builds a multi-stage KOL run ending in Data Room", () => {
    const run = buildLivePipelineRun({ workflowId: "kol-meeting-prep" });
    expect(run.stages.length).toBeGreaterThanOrEqual(6);
    expect(run.stages[0]?.agentId).toBe("literature-scout");
    expect(run.stages.at(-1)?.id).toBe("data-room");
    expect(run.oversightLabel.toLowerCase()).toContain("oversight");
    expect(progressPercent(run)).toBe(0);
  });

  it("includes manager education stages", () => {
    const defs = stageDefsFor("manager-education");
    expect(defs.some((stage) => stage.agentId === "coaching-advisor")).toBe(
      true,
    );
  });

  it("fails clearly when OpenAI key is missing without labeled fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_API_Key", "");

    await expect(
      runLivePipelineStage({
        user,
        workflowId: "kol-meeting-prep",
        stage: {
          id: "literature-scout",
          title: "Literature Scout",
          agentId: "literature-scout",
          blurb: "Surface allowlisted abstracts.",
          focusHints: ["watchlist"],
        },
        priorStages: [],
        allowLabeledFixtureFallback: false,
      }),
    ).rejects.toBeInstanceOf(LivePipelineStageError);

    try {
      await runLivePipelineStage({
        user,
        workflowId: "kol-meeting-prep",
        stage: {
          id: "literature-scout",
          title: "Literature Scout",
          agentId: "literature-scout",
          blurb: "Surface allowlisted abstracts.",
          focusHints: ["watchlist"],
        },
        priorStages: [],
        allowLabeledFixtureFallback: false,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LivePipelineStageError);
      expect((error as LivePipelineStageError).code).toBe("missing_api_key");
      expect((error as LivePipelineStageError).message.toLowerCase()).toContain(
        "openai",
      );
    }
  });

  it("supports explicit labeled fixture fallback when opted in", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_API_Key", "");

    const result = await runLivePipelineStage({
      user,
      workflowId: "kol-meeting-prep",
      stage: {
        id: "evidence-analyst",
        title: "Evidence Analyst",
        agentId: "evidence-analyst",
        blurb: "Retrieve allowlisted passages.",
        focusHints: ["passages"],
      },
      priorStages: [],
      allowLabeledFixtureFallback: true,
    });

    expect(result.source).toBe("fixture_fallback_labeled");
    expect(result.compiled.headline.toLowerCase()).toContain("fallback");
    expect(result.compiled.bullets.join(" ").toLowerCase()).toContain(
      "not a silent",
    );
  });

  it("calls OpenAI when key present and returns live source", async () => {
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
                  headline: "Literature Scout queued synthetic abstracts",
                  bullets: [
                    "Three allowlisted abstracts for HFpEF hospitalization signals.",
                    "No invented real-world DOIs.",
                    "Outputs remain untrusted until human review.",
                    "Illustrative Demo framing preserved.",
                  ],
                  evidenceNotes: "Grounded in fixture watchlist only.",
                  confidence: "provisional",
                  fields: [
                    { label: "Sources", value: "3 synthetic abstracts" },
                    { label: "Trust", value: "Untrusted until review" },
                    { label: "Release", value: "Blocked" },
                  ],
                }),
              },
            },
          ],
        }),
      })),
    );

    const result = await runLivePipelineStage({
      user,
      workflowId: "kol-meeting-prep",
      stage: {
        id: "literature-scout",
        title: "Literature Scout",
        agentId: "literature-scout",
        blurb: "Surface allowlisted abstracts.",
        focusHints: ["watchlist"],
      },
      priorStages: [],
      allowLabeledFixtureFallback: false,
    });

    expect(result.source).toBe("openai_live");
    expect(result.compiled.fields.length).toBeGreaterThanOrEqual(2);
    expect(result.compiled.headline.toLowerCase()).toContain("literature");
  });
});
