import { getAgentById } from "@/domain/agents/registry";
import { STUDIO_WORKFLOWS } from "@/domain/workflow-studio/fixtures";
import type {
  GeneratedMockReport,
  MockReportWorkflowId,
} from "@/domain/workflow-studio/mock-report";
import {
  authorizeAiGatewayRequest,
  WORKFLOW_STUDIO_MOCK_REPORT_PURPOSE,
} from "@/lib/security/ai-gateway";
import { getOpenAiApiKey } from "@/lib/security/openai-env";
import type { User } from "@/domain/types";

const OVERSIGHT_LABEL =
  "Illustrative Demo AI output — provisional only. Requires human medical/scientific oversight. Not verified clinical content. Do not auto-release.";

export function buildAllowlistedReportContext(
  workflowId: MockReportWorkflowId,
): string {
  const workflow = STUDIO_WORKFLOWS.find((item) => item.id === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  const nodeLines = workflow.nodes.map((node) => {
    const agent = getAgentById(node.agentId);
    return [
      `- Agent: ${agent?.name ?? node.agentId}`,
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

  return [
    `Workflow: ${workflow.title} (${workflow.id})`,
    `Objective: ${workflow.objective}`,
    `Audience: ${workflow.audience}`,
    `Product context: ${workflow.productContext}`,
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

  const pathway = workflow.nodes
    .map((node) => {
      const agent = getAgentById(node.agentId);
      return `- ${agent?.name ?? node.agentId}: ${node.outputSummary} [${node.status}/${node.validation}]`;
    })
    .join("\n");

  const sections = workflow.deliverable.sections
    .map((section) => `## ${section.heading}\n${section.body}`)
    .join("\n\n");

  const body = [
    "# Illustrative Demo Data — Not for clinical decision-making",
    "",
    OVERSIGHT_LABEL,
    "",
    `## ${workflow.deliverable.title}`,
    workflow.deliverable.summary,
    "",
    "## Pathway outputs used (allowlisted fixtures only)",
    pathway,
    "",
    sections,
    "",
    "## Human oversight checklist",
    "- Confirm all claims remain within the synthetic fixture corpus.",
    "- Do not treat placeholder DOIs or fictional product language as real evidence.",
    "- Medical review required before any external scientific use.",
    "",
    workflow.deliverable.disclaimer,
  ].join("\n");

  return {
    workflowId,
    title,
    body,
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

  return [
    "You generate Illustrative Demo medical-affairs workflow reports.",
    `Produce ${kind} grounded ONLY in the allowlisted synthetic fixture context provided by the user.`,
    "Rules:",
    "- Use only facts present in the provided context. If something is missing, say it is not in the allowlisted corpus.",
    "- Label the report clearly as Illustrative Demo Data.",
    "- Do not invent real-world publications, DOIs, PMIDs, trial names, or statistics.",
    "- Fictional product Aurelia™-X and synthetic personas are allowed when present in context.",
    "- State that human medical/scientific oversight is required and content must not be auto-released as verified.",
    "- Write Markdown with clear headings. Keep under 900 words.",
  ].join("\n");
}

async function callOpenAiMockReport(input: {
  workflowId: MockReportWorkflowId;
  context: string;
  apiKey: string;
}): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_tokens: 1400,
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
    throw new Error(
      `OpenAI request failed with status ${response.status}. Falling back is handled by caller.`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty mock report.");
  }
  return content;
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
    estimatedOutputTokens: 900,
    model: preferOpenAi ? "openai:gpt-4.1-mini" : "demo-synthetic",
    userId: input.user.id,
  });

  if (!gate.ok) {
    throw new Error(gate.reason);
  }

  if (preferOpenAi && apiKey) {
    try {
      const body = await callOpenAiMockReport({
        workflowId: input.workflowId,
        context,
        apiKey,
      });
      const title =
        input.workflowId === "kol-meeting-prep"
          ? "Illustrative KOL Meeting Prep Report (demo AI)"
          : "Illustrative Manager Education / IDP Report (demo AI)";
      return {
        workflowId: input.workflowId,
        title,
        body: `${OVERSIGHT_LABEL}\n\n${body}`,
        source: "openai",
        oversightLabel: OVERSIGHT_LABEL,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      // Fail soft to fixture composition so Preview remains usable if the provider errors.
      const fallback = composeFixtureMockReport(input.workflowId);
      return {
        ...fallback,
        body: `${fallback.body}\n\n_Note: Provider generation was unavailable; this report was composed from allowlisted fixtures only._`,
      };
    }
  }

  return composeFixtureMockReport(input.workflowId);
}
