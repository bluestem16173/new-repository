import type { WorkflowStudioId } from "@/domain/workflow-studio/types";

export const MOCK_REPORT_WORKFLOW_IDS = [
  "kol-meeting-prep",
  "manager-education",
] as const satisfies readonly WorkflowStudioId[];

export type MockReportWorkflowId = (typeof MOCK_REPORT_WORKFLOW_IDS)[number];

export function isMockReportWorkflowId(
  id: string,
): id is MockReportWorkflowId {
  return (MOCK_REPORT_WORKFLOW_IDS as readonly string[]).includes(id);
}

export type MockReportSectionId =
  | "visit-context"
  | "background"
  | "key-evidence"
  | "talking-points"
  | "anticipated-questions"
  | "protocol-insights"
  | "open-items"
  | "prep-actions"
  | "cohort-overview"
  | "learning-objectives"
  | "simulation-plan"
  | "competency-gaps"
  | "coaching-plan"
  | "operational-followup"
  | "idp-actions";

export interface MockReportSectionTemplate {
  id: MockReportSectionId;
  title: string;
  agentIds: string[];
  /** Keys used to seed fixture body text from workflow nodes/deliverable. */
  seedHints: string[];
}

export interface MockReportSection {
  id: MockReportSectionId;
  title: string;
  body: string;
  agentIds: string[];
}

export interface GeneratedMockReport {
  workflowId: MockReportWorkflowId;
  title: string;
  summary: string;
  sections: MockReportSection[];
  /** Concatenated markdown for export / legacy display. */
  body: string;
  source: "openai" | "fixture_compose";
  oversightLabel: string;
  generatedAt: string;
}

export const OVERSIGHT_LABEL =
  "Illustrative Demo AI output — provisional only. Requires human medical/scientific oversight. Not verified clinical content. Do not auto-release.";

export const KOL_MEETING_SECTION_TEMPLATES: MockReportSectionTemplate[] = [
  {
    id: "visit-context",
    title: "Visit Context",
    agentIds: ["medical-drafting", "literature-scout"],
    seedHints: ["Visit context", "Audience", "KOL"],
  },
  {
    id: "background",
    title: "Background",
    agentIds: ["literature-scout", "evidence-analyst"],
    seedHints: ["Background", "Topic", "HFpEF"],
  },
  {
    id: "key-evidence",
    title: "Key Evidence",
    agentIds: ["evidence-analyst", "literature-scout"],
    seedHints: ["Evidence anchors", "passages", "DOI"],
  },
  {
    id: "talking-points",
    title: "Talking Points",
    agentIds: ["knowledge-matcher", "medical-drafting"],
    seedHints: ["knowledge matches", "talking"],
  },
  {
    id: "anticipated-questions",
    title: "Anticipated Questions",
    agentIds: ["kol-simulator"],
    seedHints: ["Anticipated challenges", "challenge"],
  },
  {
    id: "protocol-insights",
    title: "Protocol Insights",
    agentIds: ["protocol-intelligence"],
    seedHints: ["Protocol", "endpoint"],
  },
  {
    id: "open-items",
    title: "Open Items",
    agentIds: ["medical-drafting", "case-completeness"],
    seedHints: ["Open items", "provisional"],
  },
  {
    id: "prep-actions",
    title: "Prep Actions",
    agentIds: ["medical-drafting", "coaching-advisor"],
    seedHints: ["review", "prepare", "follow-up"],
  },
];

export const MANAGER_EDUCATION_SECTION_TEMPLATES: MockReportSectionTemplate[] =
  [
    {
      id: "cohort-overview",
      title: "Cohort Overview",
      agentIds: ["scenario-builder", "bottleneck-analyst"],
      seedHints: ["Cohort", "MSL"],
    },
    {
      id: "learning-objectives",
      title: "Learning Objectives",
      agentIds: ["scenario-builder"],
      seedHints: ["Focus competency", "learning", "scenario"],
    },
    {
      id: "simulation-plan",
      title: "Simulation Plan",
      agentIds: ["kol-simulator"],
      seedHints: ["Simulation assignment", "simulation"],
    },
    {
      id: "competency-gaps",
      title: "Competency Gaps",
      agentIds: ["scientific-examiner"],
      seedHints: ["provisional", "critical", "gap"],
    },
    {
      id: "coaching-plan",
      title: "Coaching Plan",
      agentIds: ["coaching-advisor"],
      seedHints: ["Coaching follow-up", "coaching"],
    },
    {
      id: "operational-followup",
      title: "Operational Follow-up",
      agentIds: ["bottleneck-analyst"],
      seedHints: ["Operational signal", "bottleneck"],
    },
    {
      id: "idp-actions",
      title: "Individual Development Plan Actions",
      agentIds: ["coaching-advisor", "scientific-examiner"],
      seedHints: ["coaching", "assignment", "director"],
    },
    {
      id: "open-items",
      title: "Open Items",
      agentIds: ["coaching-advisor", "bottleneck-analyst"],
      seedHints: ["Open", "pending", "validation"],
    },
  ];

export function sectionTemplatesFor(
  workflowId: MockReportWorkflowId,
): MockReportSectionTemplate[] {
  return workflowId === "kol-meeting-prep"
    ? KOL_MEETING_SECTION_TEMPLATES
    : MANAGER_EDUCATION_SECTION_TEMPLATES;
}

export function sectionsToMarkdown(
  title: string,
  summary: string,
  sections: MockReportSection[],
): string {
  const parts = [
    "# Illustrative Demo Data — Not for clinical decision-making",
    "",
    OVERSIGHT_LABEL,
    "",
    `## ${title}`,
    summary,
    "",
    ...sections.flatMap((section) => [
      `## ${section.title}`,
      `Agents: ${section.agentIds.join(", ")}`,
      section.body,
      "",
    ]),
  ];
  return parts.join("\n").trim();
}
