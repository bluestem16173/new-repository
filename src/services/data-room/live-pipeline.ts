import { z } from "zod";
import {
  buildAllowlistedReportContext,
  composeFixtureMockReport,
} from "@/services/workflow-studio/mock-report";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import {
  authorizeAiGatewayRequest,
  DATA_ROOM_LIVE_PACKAGE_PURPOSE,
} from "@/lib/security/ai-gateway";
import { getOpenAiApiKey } from "@/lib/security/openai-env";
import type { User } from "@/domain/types";
import type {
  LiveStageCompiledCard,
  LivePipelineStage,
} from "@/domain/data-room/live-pipeline";
import { getAgentById } from "@/domain/agents/registry";
import {
  DATA_ROOM_OVERSIGHT_LABEL,
  type DataRoomPackage,
} from "@/domain/data-room/types";
import { sendPackageToDataRoom } from "@/services/data-room/packages";
import type { LivePipelineRun } from "@/domain/data-room/live-pipeline";

const compiledSchema = z.object({
  headline: z.string().min(1).max(220),
  bullets: z.array(z.string().min(1).max(400)).min(2).max(6),
  evidenceNotes: z.string().min(1).max(600),
  confidence: z.enum(["provisional", "needs_review", "illustrative"]),
  fields: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.string().min(1).max(240),
      }),
    )
    .min(2)
    .max(6),
});

export class LivePipelineStageError extends Error {
  readonly code:
    | "missing_api_key"
    | "gateway_denied"
    | "openai_http"
    | "openai_empty"
    | "openai_invalid_json"
    | "unknown";
  readonly status?: number;

  constructor(
    message: string,
    code: LivePipelineStageError["code"],
    status?: number,
  ) {
    super(message);
    this.name = "LivePipelineStageError";
    this.code = code;
    this.status = status;
  }
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new LivePipelineStageError(
      "OpenAI returned non-JSON for this stage.",
      "openai_invalid_json",
    );
  }
}

function fixtureCompiledForStage(input: {
  workflowId: MockReportWorkflowId;
  stage: Pick<LivePipelineStage, "id" | "title" | "agentId" | "blurb" | "focusHints">;
}): LiveStageCompiledCard {
  const report = composeFixtureMockReport(input.workflowId);
  const agent = getAgentById(input.stage.agentId);
  const related = report.sections.filter((section) =>
    section.agentIds.includes(input.stage.agentId),
  );
  const body =
    related[0]?.body ??
    report.summary ??
    "Allowlisted fixture content only.";

  return {
    headline: `[Labeled fixture fallback] ${agent?.name ?? input.stage.agentId}: ${input.stage.title}`,
    bullets: [
      "Explicit labeled fallback — not a silent swap for a live OpenAI result.",
      `Focus: ${input.stage.focusHints.slice(0, 3).join(", ")}.`,
      body.length > 160 ? `${body.slice(0, 157)}…` : body,
      "Human oversight required before any external scientific use.",
    ],
    evidenceNotes:
      "Compiled from allowlisted Workflow Studio fixtures only. Illustrative Demo Data.",
    confidence: "illustrative",
    fields: [
      { label: "Agent", value: agent?.name ?? input.stage.agentId },
      { label: "Source", value: "Labeled fixture fallback" },
      { label: "Corpus", value: "Allowlisted synthetic fixtures" },
      { label: "Release", value: "Blocked — oversight required" },
    ],
    rawExcerpt: body,
  };
}

async function callOpenAiStage(input: {
  workflowId: MockReportWorkflowId;
  stage: Pick<
    LivePipelineStage,
    "id" | "title" | "agentId" | "blurb" | "focusHints"
  >;
  priorSummaries: string;
  context: string;
  apiKey: string;
}): Promise<LiveStageCompiledCard> {
  const agent = getAgentById(input.stage.agentId);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are a MedIntel agent stage in an Illustrative Demo live pipeline.",
            "Return STRICT JSON: {headline, bullets[], evidenceNotes, confidence, fields:[{label,value}]}",
            "confidence: provisional | needs_review | illustrative",
            "Ground ONLY in allowlisted synthetic fixture context. Never invent real DOIs, trials, or clinical claims.",
            "Produce dense, employer-wow compiled cards: specific, structured, provisional tone.",
            "Always imply human oversight is required. No auto-release language.",
            "4-5 bullets. 3-5 fields. Headline under 16 words.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `Stage: ${input.stage.title} (${input.stage.id})`,
            `Agent: ${agent?.name ?? input.stage.agentId} (${input.stage.agentId})`,
            `Stage brief: ${input.stage.blurb}`,
            `Focus hints: ${input.stage.focusHints.join(", ")}`,
            "",
            "Prior approved stage digests:",
            input.priorSummaries || "(none yet)",
            "",
            "Allowlisted fixture context:",
            input.context,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new LivePipelineStageError(
      `OpenAI stage call failed (HTTP ${response.status}).`,
      "openai_http",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new LivePipelineStageError(
      "OpenAI returned an empty stage payload.",
      "openai_empty",
    );
  }

  const parsed = compiledSchema.parse(extractJsonObject(content));
  return { ...parsed, rawExcerpt: parsed.bullets.join(" ") };
}

export async function runLivePipelineStage(input: {
  user: User;
  workflowId: MockReportWorkflowId;
  stage: Pick<
    LivePipelineStage,
    "id" | "title" | "agentId" | "blurb" | "focusHints"
  >;
  priorStages: Array<{
    id: string;
    title: string;
    agentId: string;
    compiled: LiveStageCompiledCard | null;
  }>;
  allowLabeledFixtureFallback: boolean;
}): Promise<{
  compiled: LiveStageCompiledCard;
  source: "openai_live" | "fixture_fallback_labeled";
}> {
  const context = buildAllowlistedReportContext(input.workflowId);
  const priorSummaries = input.priorStages
    .filter((stage) => stage.compiled)
    .map(
      (stage) =>
        `- ${stage.title} (${stage.agentId}): ${stage.compiled!.headline} | ${stage.compiled!.bullets.slice(0, 2).join("; ")}`,
    )
    .join("\n");

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    if (!input.allowLabeledFixtureFallback) {
      throw new LivePipelineStageError(
        "OpenAI API key is not configured on the server (OPENAI_API_KEY or OPENAI_API_Key). Add the key and redeploy Preview to run live stages.",
        "missing_api_key",
      );
    }
    return {
      compiled: fixtureCompiledForStage({
        workflowId: input.workflowId,
        stage: input.stage,
      }),
      source: "fixture_fallback_labeled",
    };
  }

  const gate = await authorizeAiGatewayRequest({
    agentId: input.stage.agentId,
    purpose: DATA_ROOM_LIVE_PACKAGE_PURPOSE,
    inputChars: context.length + priorSummaries.length,
    estimatedOutputTokens: 700,
    model: "openai:gpt-4.1-mini",
    userId: input.user.id,
  });
  if (!gate.ok) {
    throw new LivePipelineStageError(gate.reason, "gateway_denied");
  }

  try {
    const compiled = await callOpenAiStage({
      workflowId: input.workflowId,
      stage: input.stage,
      priorSummaries,
      context,
      apiKey,
    });
    return { compiled, source: "openai_live" };
  } catch (error) {
    if (!input.allowLabeledFixtureFallback) {
      throw error;
    }
    return {
      compiled: fixtureCompiledForStage({
        workflowId: input.workflowId,
        stage: input.stage,
      }),
      source: "fixture_fallback_labeled",
    };
  }
}

export async function finalizeLivePipelinePackage(input: {
  user: User;
  run: LivePipelineRun;
}): Promise<DataRoomPackage> {
  const approved = input.run.stages.filter(
    (stage) => stage.status === "approved" && stage.compiled,
  );

  const sections = approved.map((stage) => ({
    id: stage.id,
    title: stage.title,
    agentIds: [stage.agentId],
    body: [
      stage.compiled!.headline,
      "",
      ...stage.compiled!.bullets.map((b) => `• ${b}`),
      "",
      `Evidence: ${stage.compiled!.evidenceNotes}`,
      `Confidence: ${stage.compiled!.confidence}`,
      ...stage.compiled!.fields.map((f) => `${f.label}: ${f.value}`),
    ].join("\n"),
  }));

  const liveCount = approved.filter((s) => s.source === "openai_live").length;
  const fallbackCount = approved.filter(
    (s) => s.source === "fixture_fallback_labeled",
  ).length;

  const title = `${input.run.title} — Final Package`;
  const summary = [
    `Live staged session with ${approved.length} approved agent stages.`,
    `${liveCount} OpenAI-live · ${fallbackCount} labeled fixture fallback.`,
    "Illustrative Demo only — human oversight required.",
  ].join(" ");

  return sendPackageToDataRoom({
    user: input.user,
    payload: {
      title,
      summary,
      workflowType: input.run.workflowId,
      sections:
        sections.length > 0
          ? sections
          : [
              {
                id: "empty",
                title: "No approved stages",
                body: "Session finalized without approved stage cards.",
                agentIds: ["medical-drafting"],
              },
            ],
      accessEmails: input.run.accessEmails,
    },
    generationSource:
      liveCount > 0 ? "openai_live" : "fixture_fallback_labeled",
    demoLabelOverride:
      liveCount > 0
        ? "Illustrative Demo — live staged OpenAI pipeline over allowlisted fixtures. Human oversight required."
        : "LABELED FIXTURE FALLBACK package — not a fully live OpenAI run. Illustrative Demo only.",
    oversightLabelOverride: DATA_ROOM_OVERSIGHT_LABEL,
  });
}
