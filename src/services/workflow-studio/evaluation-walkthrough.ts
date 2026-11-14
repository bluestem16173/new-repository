import { z } from "zod";
import { getAgentById } from "@/domain/agents/registry";
import {
  composeFixtureSectionEvaluation,
  type SectionEvaluation,
} from "@/domain/workflow-studio/evaluation-walkthrough";
import {
  authorizeAiGatewayRequest,
  WORKFLOW_STUDIO_SECTION_EVAL_PURPOSE,
} from "@/lib/security/ai-gateway";
import { getOpenAiApiKey } from "@/lib/security/openai-env";
import type { User } from "@/domain/types";

const openaiEvalSchema = z.object({
  headline: z.string().min(1).max(200),
  findings: z.array(z.string().min(1).max(400)).min(1).max(5),
  confidence: z.enum(["provisional", "needs_review", "illustrative"]),
  evidenceNotes: z.string().min(1).max(600),
});

export async function evaluateWalkthroughSection(input: {
  user: User;
  sectionId: string;
  sectionTitle: string;
  sectionBody: string;
  agentId: string;
  allowlistedContext: string;
}): Promise<SectionEvaluation> {
  const fixture = composeFixtureSectionEvaluation({
    sectionId: input.sectionId,
    sectionTitle: input.sectionTitle,
    sectionBody: input.sectionBody,
    agentId: input.agentId,
  });

  const apiKey = getOpenAiApiKey();
  const preferOpenAi = Boolean(apiKey);
  const contextChars =
    input.allowlistedContext.length +
    input.sectionBody.length +
    input.sectionTitle.length;

  const gate = await authorizeAiGatewayRequest({
    agentId: input.agentId,
    purpose: WORKFLOW_STUDIO_SECTION_EVAL_PURPOSE,
    inputChars: contextChars,
    estimatedOutputTokens: 400,
    model: preferOpenAi ? "openai:gpt-4.1-mini" : "demo-synthetic",
    userId: input.user.id,
  });

  if (!gate.ok) {
    return fixture;
  }

  if (!preferOpenAi || !apiKey) {
    return fixture;
  }

  try {
    const agent = getAgentById(input.agentId);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You write Illustrative Demo evaluation notes for MedIntel Workflow Studio.",
              "Return JSON only: {headline, findings[], confidence, evidenceNotes}.",
              "confidence must be one of: provisional | needs_review | illustrative.",
              "Use ONLY the allowlisted synthetic fixture context. Never invent real DOIs, trials, or clinical claims.",
              "Keep findings to 2-4 short bullets. State that output requires human oversight.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              `Evaluating agent: ${agent?.name ?? input.agentId} (${input.agentId})`,
              `Section: ${input.sectionTitle} (${input.sectionId})`,
              `Section body: ${input.sectionBody}`,
              "",
              "Allowlisted context:",
              input.allowlistedContext,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fixture;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) return fixture;

    const parsed = openaiEvalSchema.parse(JSON.parse(content));
    return {
      sectionId: input.sectionId,
      sectionTitle: input.sectionTitle,
      agentId: input.agentId,
      agentName: agent?.name ?? input.agentId,
      headline: parsed.headline,
      findings: parsed.findings,
      confidence: parsed.confidence,
      evidenceNotes: parsed.evidenceNotes,
      source: "openai",
      evaluatedAt: new Date().toISOString(),
    };
  } catch {
    return fixture;
  }
}
