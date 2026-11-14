import { z } from "zod";
import { getAgentById } from "@/domain/agents/registry";
import { STUDIO_WORKFLOWS } from "@/domain/workflow-studio/fixtures";
import {
  OVERSIGHT_LABEL,
  sectionTemplatesFor,
  sectionsToMarkdown,
  type GeneratedMockReport,
  type MockReportSection,
  type MockReportSectionId,
  type MockReportWorkflowId,
} from "@/domain/workflow-studio/mock-report";
import {
  authorizeAiGatewayRequest,
  WORKFLOW_STUDIO_MOCK_REPORT_PURPOSE,
} from "@/lib/security/ai-gateway";
import { getOpenAiApiKey } from "@/lib/security/openai-env";
import type { User } from "@/domain/types";

const openaiSectionSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(4000),
  agentIds: z.array(z.string().min(1).max(80)).max(8).optional(),
});

const openaiReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(1200).optional(),
  sections: z.array(openaiSectionSchema).min(1).max(16),
});

export function buildAllowlistedReportContext(
  workflowId: MockReportWorkflowId,
): string {
  const workflow = STUDIO_WORKFLOWS.find((item) => item.id === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  const templates = sectionTemplatesFor(workflowId);
  const nodeLines = workflow.nodes.map((node) => {
    const agent = getAgentById(node.agentId);
    return [
      `- Agent: ${agent?.name ?? node.agentId} (id=${node.agentId})`,
      `  Task: ${node.task}`,
      `  Status: ${node.status}; validation: ${node.validation}`,
      `  Input: ${node.inputSummary}`,
      `  Output: ${node.outputSummary}`,
      `  Validation notes: ${node.validationNotes}`,
    ].join("\n");
  });

  const deliverableLines = workflow.deliverable.sections.map(
    (section) => `### ${section.heading}\n${section.body}`,
  );

  const templateLines = templates.map(
    (template) =>
      `- ${template.id}: "${template.title}" owned by [${template.agentIds.join(", ")}]`,
  );

  return [
    `Workflow: ${workflow.title} (${workflow.id})`,
    `Objective: ${workflow.objective}`,
    `Audience: ${workflow.audience}`,
    `Product context: ${workflow.productContext}`,
    "",
    "Required JSON section ids and owning agents:",
    ...templateLines,
    "",
    "Allowlisted pathway nodes (synthetic only):",
    ...nodeLines,
    "",
    `Fixture deliverable title: ${workflow.deliverable.title}`,
    `Fixture deliverable summary: ${workflow.deliverable.summary}`,
    ...deliverableLines,
    "",
    `Fixture disclaimer: ${workflow.deliverable.disclaimer}`,
  ].join("\n");
}

function seedSectionBody(
  workflowId: MockReportWorkflowId,
  sectionId: MockReportSectionId,
  seedHints: string[],
): string {
  const workflow = STUDIO_WORKFLOWS.find((item) => item.id === workflowId);
  if (!workflow) return "Not present in the allowlisted corpus.";

  const haystack = [
    workflow.deliverable.summary,
    ...workflow.deliverable.sections.map(
      (section) => `${section.heading}\n${section.body}`,
    ),
    ...workflow.nodes.map(
      (node) =>
        `${node.task}\n${node.inputSummary}\n${node.outputSummary}\n${node.validationNotes}`,
    ),
  ].join("\n\n");

  const matchedDeliverable = workflow.deliverable.sections.find((section) =>
    seedHints.some((hint) =>
      `${section.heading} ${section.body}`
        .toLowerCase()
        .includes(hint.toLowerCase()),
    ),
  );
  if (matchedDeliverable) {
    return matchedDeliverable.body;
  }

  const matchedNodes = workflow.nodes.filter((node) =>
    seedHints.some((hint) =>
      `${node.task} ${node.outputSummary} ${node.inputSummary}`
        .toLowerCase()
        .includes(hint.toLowerCase()),
    ),
  );
  if (matchedNodes.length > 0) {
    return matchedNodes
      .map((node) => {
        const agent = getAgentById(node.agentId);
        return `${agent?.name ?? node.agentId}: ${node.outputSummary}`;
      })
      .join(" ");
  }

  if (sectionId === "prep-actions" || sectionId === "idp-actions") {
    return "Review provisional outputs with a qualified human reviewer before any external scientific use. Confirm fixture-only claims and unresolved validation warnings.";
  }

  if (haystack.length > 0) {
    return "Derived from allowlisted fixture pathway outputs. No additional detail is present in the synthetic corpus for this heading.";
  }

  return "Not present in the allowlisted corpus.";
}

export function composeFixtureMockReport(
  workflowId: MockReportWorkflowId,
): GeneratedMockReport {
  const workflow = STUDIO_WORKFLOWS.find((item) => item.id === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  const title =
    workflowId === "kol-meeting-prep"
      ? "Illustrative KOL Meeting Prep Report (demo AI compose)"
      : "Illustrative Manager Education / Individual Development Plan (demo AI compose)";

  const templates = sectionTemplatesFor(workflowId);
  const sections: MockReportSection[] = templates.map((template) => ({
    id: template.id,
    title: template.title,
    agentIds: [...template.agentIds],
    body: seedSectionBody(workflowId, template.id, template.seedHints),
  }));

  const summary = workflow.deliverable.summary;
  return {
    workflowId,
    title,
    summary,
    sections,
    body: sectionsToMarkdown(title, summary, sections),
    source: "fixture_compose",
    oversightLabel: OVERSIGHT_LABEL,
    generatedAt: new Date().toISOString(),
  };
}

function reportSystemPrompt(workflowId: MockReportWorkflowId): string {
  const kind =
    workflowId === "kol-meeting-prep"
      ? "an MSL KOL Meeting Prep briefing packet"
      : "a Manager Education / Individual Development Plan";
  const templates = sectionTemplatesFor(workflowId);
  const sectionSpec = templates
    .map(
      (template) =>
        `{"id":"${template.id}","title":"${template.title}","agentIds":${JSON.stringify(template.agentIds)},"body":"..."}`,
    )
    .join(",\n");

  return [
    "You generate Illustrative Demo medical-affairs workflow reports as STRICT JSON only.",
    `Produce ${kind} grounded ONLY in the allowlisted synthetic fixture context.`,
    "Return JSON shaped as:",
    '{"title":"...","summary":"...","sections":[...]}',
    "Sections MUST use these ids/titles/agentIds (body text only may vary):",
    `[${sectionSpec}]`,
    "Rules:",
    "- Use only facts present in the provided context. If missing, say it is not in the allowlisted corpus.",
    "- Do not invent real-world publications, DOIs, PMIDs, trial names, or statistics.",
    "- Fictional product Aurelia™-X and synthetic personas are allowed when present in context.",
    "- Keep each section body under 120 words.",
    "- Output JSON only. No markdown fences.",
  ].join("\n");
}

function normalizeOpenAiSections(
  workflowId: MockReportWorkflowId,
  parsed: z.infer<typeof openaiReportSchema>,
): MockReportSection[] {
  const templates = sectionTemplatesFor(workflowId);
  return templates.map((template) => {
    const match = parsed.sections.find((section) => section.id === template.id);
    const allowedAgents = new Set(template.agentIds);
    const agentIds = (match?.agentIds ?? template.agentIds).filter((id) =>
      allowedAgents.has(id),
    );
    return {
      id: template.id,
      title: template.title,
      agentIds: agentIds.length > 0 ? agentIds : [...template.agentIds],
      body:
        match?.body?.trim() ||
        seedSectionBody(workflowId, template.id, template.seedHints),
    };
  });
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
    throw new Error("OpenAI response was not valid JSON.");
  }
}

async function callOpenAiStructuredReport(input: {
  workflowId: MockReportWorkflowId;
  context: string;
  apiKey: string;
}): Promise<GeneratedMockReport> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: reportSystemPrompt(input.workflowId) },
        {
          role: "user",
          content: [
            "Allowlisted synthetic fixture context follows. Answer only from this context.",
            "",
            input.context,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty mock report.");
  }

  const parsed = openaiReportSchema.parse(extractJsonObject(content));
  const sections = normalizeOpenAiSections(input.workflowId, parsed);
  const title =
    parsed.title?.trim() ||
    (input.workflowId === "kol-meeting-prep"
      ? "Illustrative KOL Meeting Prep Report (demo AI)"
      : "Illustrative Manager Education / IDP Report (demo AI)");
  const summary =
    parsed.summary?.trim() ||
    STUDIO_WORKFLOWS.find((item) => item.id === input.workflowId)?.deliverable
      .summary ||
    "Illustrative demo summary from allowlisted fixtures.";

  return {
    workflowId: input.workflowId,
    title,
    summary,
    sections,
    body: sectionsToMarkdown(title, summary, sections),
    source: "openai",
    oversightLabel: OVERSIGHT_LABEL,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateWorkflowStudioMockReport(input: {
  workflowId: MockReportWorkflowId;
  user: User;
}): Promise<GeneratedMockReport> {
  const context = buildAllowlistedReportContext(input.workflowId);
  const apiKey = getOpenAiApiKey();
  const preferOpenAi = Boolean(apiKey);

  const gate = await authorizeAiGatewayRequest({
    agentId: "workflow-studio-mock-report",
    purpose: WORKFLOW_STUDIO_MOCK_REPORT_PURPOSE,
    inputChars: context.length,
    estimatedOutputTokens: 1100,
    model: preferOpenAi ? "openai:gpt-4.1-mini" : "demo-synthetic",
    userId: input.user.id,
  });

  if (!gate.ok) {
    // Keep mock report generation solid for demos: soft-fallback to fixtures.
    const fallback = composeFixtureMockReport(input.workflowId);
    return {
      ...fallback,
      summary: `${fallback.summary} Provider authorization was unavailable; composed from allowlisted fixtures only.`,
    };
  }

  if (preferOpenAi && apiKey) {
    try {
      return await callOpenAiStructuredReport({
        workflowId: input.workflowId,
        context,
        apiKey,
      });
    } catch {
      const fallback = composeFixtureMockReport(input.workflowId);
      return {
        ...fallback,
        summary: `${fallback.summary} Provider generation was unavailable; composed from allowlisted fixtures only.`,
      };
    }
  }

  return composeFixtureMockReport(input.workflowId);
}
