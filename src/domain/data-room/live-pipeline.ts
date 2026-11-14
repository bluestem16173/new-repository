import { getAgentById } from "@/domain/agents/registry";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import { z } from "zod";

export const LIVE_PIPELINE_OVERSIGHT =
  "Illustrative Demo — live staged AI. Provisional only. Requires human medical/scientific oversight. Not verified clinical content. Do not auto-release.";

export const LIVE_PIPELINE_STORAGE_KEY =
  "medintel.data-room.live-pipeline-runs.v1";

export type LiveStageStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "approved"
  | "failed";

export type LivePipelineRunStatus =
  | "active"
  | "completed"
  | "failed"
  | "abandoned";

export type LiveStageCompiledCard = {
  headline: string;
  bullets: string[];
  evidenceNotes: string;
  confidence: "provisional" | "needs_review" | "illustrative";
  fields: Array<{ label: string; value: string }>;
  rawExcerpt?: string;
};

export type LivePipelineStageDef = {
  id: string;
  agentId: string;
  title: string;
  blurb: string;
  focusHints: string[];
};

export type LivePipelineStage = LivePipelineStageDef & {
  index: number;
  agentName: string;
  agentRoute: string;
  status: LiveStageStatus;
  compiled: LiveStageCompiledCard | null;
  source: "openai_live" | "fixture_fallback_labeled" | null;
  error: string | null;
  ranAt: string | null;
  approvedAt: string | null;
};

export type LivePipelineRun = {
  id: string;
  workflowId: MockReportWorkflowId;
  title: string;
  status: LivePipelineRunStatus;
  stages: LivePipelineStage[];
  currentStageIndex: number;
  accessEmails: string[];
  createdAt: string;
  updatedAt: string;
  packageId: string | null;
  oversightLabel: string;
};

export const KOL_LIVE_STAGES: LivePipelineStageDef[] = [
  {
    id: "literature-scout",
    agentId: "literature-scout",
    title: "Literature Scout",
    blurb: "Surface allowlisted synthetic abstracts for the KOL visit topic.",
    focusHints: ["watchlist", "abstracts", "HFpEF", "sources"],
  },
  {
    id: "evidence-analyst",
    agentId: "evidence-analyst",
    title: "Evidence Analyst",
    blurb: "Retrieve allowlisted passages with provenance placeholders.",
    focusHints: ["passages", "DOI placeholders", "section anchors", "untrusted"],
  },
  {
    id: "protocol-intelligence",
    agentId: "protocol-intelligence",
    title: "Protocol Intelligence",
    blurb: "Extract illustrative endpoint hierarchy cues from demo protocol excerpts.",
    focusHints: ["endpoint", "CV death", "HHF", "KCCQ", "planned"],
  },
  {
    id: "knowledge-matcher",
    agentId: "knowledge-matcher",
    title: "Scientific Knowledge Matching",
    blurb: "Rank approved reusable talking points; flag explicit no-supported-match gaps.",
    focusHints: ["talking points", "renal", "volume", "no-supported-match"],
  },
  {
    id: "kol-simulator",
    agentId: "kol-simulator",
    title: "KOL Simulator",
    blurb: "Flag challenging follow-ups the fictional KOL may raise.",
    focusHints: ["challenge", "class-effect", "volume status", "rehearsal"],
  },
  {
    id: "medical-drafting",
    agentId: "medical-drafting",
    title: "Medical Drafting",
    blurb: "Assemble provisional briefing notes with uncertainty labels.",
    focusHints: ["briefing", "provisional", "open items", "oversight"],
  },
  {
    id: "final-report",
    agentId: "medical-drafting",
    title: "Final Report Compile",
    blurb: "Consolidate prior stage cards into a dense Final Report packet.",
    focusHints: ["consolidate", "final report", "sections", "attributions"],
  },
  {
    id: "data-room",
    agentId: "leadership-briefing",
    title: "Data Room Package",
    blurb: "Package the approved live run for authenticated colleague retrieval.",
    focusHints: ["data room", "access list", "share", "audit"],
  },
];

export const MANAGER_LIVE_STAGES: LivePipelineStageDef[] = [
  {
    id: "scenario-builder",
    agentId: "scenario-builder",
    title: "Scenario Builder",
    blurb: "Select education scenario objectives for the synthetic cohort.",
    focusHints: ["scenario", "learning objectives", "HFpEF"],
  },
  {
    id: "kol-simulator",
    agentId: "kol-simulator",
    title: "KOL Simulator",
    blurb: "Stage allowlisted simulation sessions for the cohort.",
    focusHints: ["simulation", "cohort", "provisional scores"],
  },
  {
    id: "scientific-examiner",
    agentId: "scientific-examiner",
    title: "Scientific Examiner",
    blurb: "Produce provisional competency evaluations with critical flags.",
    focusHints: ["rubric", "critical flags", "validation"],
  },
  {
    id: "coaching-advisor",
    agentId: "coaching-advisor",
    title: "Coaching Advisor",
    blurb: "Draft coaching activities tied to identified gaps.",
    focusHints: ["coaching", "gaps", "director assignment"],
  },
  {
    id: "bottleneck-analyst",
    agentId: "bottleneck-analyst",
    title: "Bottleneck Analyst",
    blurb: "Surface readiness and coaching backlog signals.",
    focusHints: ["backlog", "observational", "denominators"],
  },
  {
    id: "final-report",
    agentId: "coaching-advisor",
    title: "Final Report Compile",
    blurb: "Consolidate stage outputs into an education Final Report.",
    focusHints: ["IDP", "consolidate", "final report"],
  },
  {
    id: "data-room",
    agentId: "leadership-briefing",
    title: "Data Room Package",
    blurb: "Package the approved live education run for colleague retrieval.",
    focusHints: ["data room", "share", "access list"],
  },
];

export function stageDefsFor(
  workflowId: MockReportWorkflowId,
): LivePipelineStageDef[] {
  return workflowId === "kol-meeting-prep"
    ? KOL_LIVE_STAGES
    : MANAGER_LIVE_STAGES;
}

export function createLivePipelineRunId(): string {
  return `lpr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLivePipelineRun(input: {
  workflowId: MockReportWorkflowId;
  accessEmails?: string[];
}): LivePipelineRun {
  const now = new Date().toISOString();
  const defs = stageDefsFor(input.workflowId);
  const stages: LivePipelineStage[] = defs.map((def, index) => {
    const agent = getAgentById(def.agentId);
    return {
      ...def,
      index,
      agentName: agent?.name ?? def.agentId,
      agentRoute: agent?.route ?? `/agents/${def.agentId}`,
      status: index === 0 ? "queued" : "queued",
      compiled: null,
      source: null,
      error: null,
      ranAt: null,
      approvedAt: null,
    };
  });

  return {
    id: createLivePipelineRunId(),
    workflowId: input.workflowId,
    title:
      input.workflowId === "kol-meeting-prep"
        ? "Live KOL Meeting Prep Session"
        : "Live Manager Education Session",
    status: "active",
    stages,
    currentStageIndex: 0,
    accessEmails: input.accessEmails ?? [],
    createdAt: now,
    updatedAt: now,
    packageId: null,
    oversightLabel: LIVE_PIPELINE_OVERSIGHT,
  };
}

export const startLivePipelineSchema = z.object({
  workflowId: z.enum(["kol-meeting-prep", "manager-education"]),
  accessEmails: z.array(z.string().email().max(200)).max(25).default([]),
});

export const runLiveStageSchema = z.object({
  runId: z.string().min(1).max(80),
  stageId: z.string().min(1).max(80),
  workflowId: z.enum(["kol-meeting-prep", "manager-education"]),
  priorStages: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        agentId: z.string(),
        compiled: z
          .object({
            headline: z.string(),
            bullets: z.array(z.string()),
            evidenceNotes: z.string(),
            confidence: z.enum([
              "provisional",
              "needs_review",
              "illustrative",
            ]),
            fields: z.array(
              z.object({ label: z.string(), value: z.string() }),
            ),
          })
          .nullable(),
      }),
    )
    .max(16),
  allowLabeledFixtureFallback: z.boolean().default(false),
});

export const approveLiveStageSchema = z.object({
  runId: z.string().min(1).max(80),
  stageId: z.string().min(1).max(80),
});

export function progressPercent(run: LivePipelineRun): number {
  if (run.stages.length === 0) return 0;
  const approved = run.stages.filter((s) => s.status === "approved").length;
  return Math.round((approved / run.stages.length) * 100);
}

export function currentStage(run: LivePipelineRun): LivePipelineStage | null {
  return run.stages[run.currentStageIndex] ?? null;
}
