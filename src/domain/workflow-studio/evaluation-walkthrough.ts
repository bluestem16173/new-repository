import { getAgentById } from "@/domain/agents/registry";
import {
  OVERSIGHT_LABEL,
  type MockReportSectionId,
  type MockReportWorkflowId,
} from "@/domain/workflow-studio/mock-report";
import type { CreateAgentFollowUpTaskInput } from "@/domain/workflow-studio/agent-follow-up-tasks";

export const WALKTHROUGH_DEMO_LABEL =
  "Illustrative Demo evaluation walkthrough — provisional agent notes only. Not verified clinical content. Requires human oversight.";

export type WalkthroughStepStatus = "pending" | "active" | "done";

export type SectionEvaluation = {
  sectionId: string;
  sectionTitle: string;
  agentId: string;
  agentName: string;
  headline: string;
  findings: string[];
  confidence: "provisional" | "needs_review" | "illustrative";
  evidenceNotes: string;
  source: "fixture_compose" | "openai";
  evaluatedAt: string;
};

export type WalkthroughStep = {
  index: number;
  sectionId: string;
  sectionTitle: string;
  sectionBody: string;
  agentId: string;
  agentName: string;
  status: WalkthroughStepStatus;
  evaluation: SectionEvaluation | null;
};

export type FinalReport = {
  workflowId: MockReportWorkflowId;
  title: string;
  summary: string;
  packetTitle: string;
  packetSummary: string;
  sections: Array<{
    id: string;
    title: string;
    body: string;
    agentIds: string[];
    evaluation: SectionEvaluation | null;
  }>;
  oversightLabel: string;
  walkthroughLabel: string;
  completedAt: string;
  evaluatedCount: number;
};

export type WalkthroughSectionInput = {
  id: string;
  title: string;
  body: string;
  agentIds: string[];
};

/** Primary owning agent for a section (first mapped owner). */
export function primaryAgentIdForSection(agentIds: string[]): string {
  return agentIds[0] ?? "medical-drafting";
}

export function buildWalkthroughSteps(
  sections: WalkthroughSectionInput[],
): WalkthroughStep[] {
  return sections.map((section, index) => {
    const agentId = primaryAgentIdForSection(section.agentIds);
    const agent = getAgentById(agentId);
    return {
      index,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionBody: section.body,
      agentId,
      agentName: agent?.name ?? agentId,
      status: "pending",
      evaluation: null,
    };
  });
}

/** Auto-assign one open follow-up task per section to its primary owning agent. */
export function buildSectionAssignmentTasks(input: {
  workflowId: MockReportWorkflowId;
  reportTitle: string;
  sections: WalkthroughSectionInput[];
  existing?: Array<{ sectionId: string; agentId: string }>;
}): CreateAgentFollowUpTaskInput[] {
  const existingKeys = new Set(
    (input.existing ?? []).map(
      (task) => `${task.sectionId}::${task.agentId}`,
    ),
  );

  const assignments: CreateAgentFollowUpTaskInput[] = [];
  for (const section of input.sections) {
    const agentId = primaryAgentIdForSection(section.agentIds);
    const key = `${section.id}::${agentId}`;
    if (existingKeys.has(key)) continue;
    assignments.push({
      sectionId: section.id as MockReportSectionId | "custom",
      agentId,
      note: `Assigned for evaluation walkthrough: “${section.title}”. Illustrative Demo only — human oversight required.`,
      workflowId: input.workflowId,
      reportTitle: input.reportTitle,
    });
  }
  return assignments;
}

const FIXTURE_EVAL_BY_SECTION: Record<
  string,
  (agentName: string, sectionBody: string) => Omit<
    SectionEvaluation,
    "sectionId" | "sectionTitle" | "agentId" | "agentName" | "source" | "evaluatedAt"
  >
> = {
  "visit-context": (agentName, body) => ({
    headline: `${agentName}: visit framing is exchange-ready (demo)`,
    findings: [
      "Audience and objective are labeled non-promotional scientific exchange.",
      "Persona remains synthetic (Dr. Mira Chen) — no real HCP identity.",
      truncateEvidence(body),
    ],
    confidence: "provisional",
    evidenceNotes:
      "Grounded only in allowlisted fixture visit context. No live CRM or HCP directory access.",
  }),
  background: (agentName, body) => ({
    headline: `${agentName}: topic scope stays inside synthetic HFpEF corpus`,
    findings: [
      "Background cites demo watchlist signals only.",
      "No invented real-world publications or endpoints beyond fixtures.",
      truncateEvidence(body),
    ],
    confidence: "illustrative",
    evidenceNotes:
      "Literature Scout / Evidence Analyst queue items are illustrative abstracts only.",
  }),
  "key-evidence": (agentName, body) => ({
    headline: `${agentName}: evidence anchors remain untrusted until review`,
    findings: [
      "Passages use placeholder DOIs and section anchors from the demo store.",
      "Explicit no-invention rule observed — no fabricated real DOIs.",
      truncateEvidence(body),
    ],
    confidence: "needs_review",
    evidenceNotes:
      "Retrieved content is untrusted. Human medical/scientific review required before any external use.",
  }),
  "talking-points": (agentName, body) => ({
    headline: `${agentName}: reusable matches ranked with explicit gaps`,
    findings: [
      "Approved knowledge matches are applicability-ranked, not auto-released.",
      "Explicit no-supported-match preserved where fixtures lack coverage.",
      truncateEvidence(body),
    ],
    confidence: "provisional",
    evidenceNotes:
      "Knowledge Matching outputs require human verification before field use.",
  }),
  "anticipated-questions": (agentName, body) => ({
    headline: `${agentName}: challenge prompts tied to allowlisted passages`,
    findings: [
      "Deterministic teaching turns only — no generative HCP persona in this preview.",
      "Volume status, class-effect, and renal monitoring cues stay fixture-bound.",
      truncateEvidence(body),
    ],
    confidence: "illustrative",
    evidenceNotes:
      "KOL Simulator flags are for rehearsal, not clinical prediction.",
  }),
  "protocol-insights": (agentName, body) => ({
    headline: `${agentName}: endpoint hierarchy is illustrative structure only`,
    findings: [
      "Primary/secondary cues mirror demo protocol excerpt v2.1.",
      "Protocol Intelligence remains planned — treat outputs as teaching scaffolds.",
      truncateEvidence(body),
    ],
    confidence: "needs_review",
    evidenceNotes:
      "Do not present demo endpoint cues as live protocol truth.",
  }),
  "open-items": (agentName, body) => ({
    headline: `${agentName}: provisional items correctly block auto-release`,
    findings: [
      "Drafting notes remain provisional pending MSL review.",
      "Validation warnings are surfaced rather than suppressed.",
      truncateEvidence(body),
    ],
    confidence: "needs_review",
    evidenceNotes:
      "Open items are demo process signals, not clinical action items.",
  }),
  "prep-actions": (agentName, body) => ({
    headline: `${agentName}: prep checklist emphasizes human oversight`,
    findings: [
      "Actions prioritize review, rehearsal, and withhold-until-sign-off.",
      "No auto-release path is recommended in this demo packet.",
      truncateEvidence(body),
    ],
    confidence: "provisional",
    evidenceNotes:
      "Coaching / drafting prep actions are illustrative workflow hygiene only.",
  }),
};

function truncateEvidence(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 140) return `Fixture excerpt: ${trimmed}`;
  return `Fixture excerpt: ${trimmed.slice(0, 137)}…`;
}

export function composeFixtureSectionEvaluation(input: {
  sectionId: string;
  sectionTitle: string;
  sectionBody: string;
  agentId: string;
}): SectionEvaluation {
  const agent = getAgentById(input.agentId);
  const agentName = agent?.name ?? input.agentId;
  const builder =
    FIXTURE_EVAL_BY_SECTION[input.sectionId] ??
    ((name: string, body: string) => ({
      headline: `${name}: section reviewed against allowlisted fixtures`,
      findings: [
        "Evaluation limited to synthetic packet content.",
        "No live clinical claims generated.",
        truncateEvidence(body),
      ],
      confidence: "illustrative" as const,
      evidenceNotes:
        "Fallback fixture evaluation — Illustrative Demo only.",
    }));

  const built = builder(agentName, input.sectionBody);
  return {
    sectionId: input.sectionId,
    sectionTitle: input.sectionTitle,
    agentId: input.agentId,
    agentName,
    ...built,
    source: "fixture_compose",
    evaluatedAt: new Date().toISOString(),
  };
}

export function assembleFinalReport(input: {
  workflowId: MockReportWorkflowId;
  packetTitle: string;
  packetSummary: string;
  sections: WalkthroughSectionInput[];
  evaluations: SectionEvaluation[];
}): FinalReport {
  const bySection = new Map(
    input.evaluations.map((evaluation) => [evaluation.sectionId, evaluation]),
  );
  const evaluatedCount = input.sections.filter((section) =>
    bySection.has(section.id),
  ).length;

  return {
    workflowId: input.workflowId,
    title: `Final Report — ${input.packetTitle}`,
    summary:
      "Consolidated Illustrative Demo packet plus per-section agent evaluation notes. Shareable final product for demo walkthrough only — not for clinical decision-making.",
    packetTitle: input.packetTitle,
    packetSummary: input.packetSummary,
    sections: input.sections.map((section) => ({
      id: section.id,
      title: section.title,
      body: section.body,
      agentIds: section.agentIds,
      evaluation: bySection.get(section.id) ?? null,
    })),
    oversightLabel: OVERSIGHT_LABEL,
    walkthroughLabel: WALKTHROUGH_DEMO_LABEL,
    completedAt: new Date().toISOString(),
    evaluatedCount,
  };
}
