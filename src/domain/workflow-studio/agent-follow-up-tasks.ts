import { z } from "zod";
import {
  MANAGER_EDUCATION_SECTION_TEMPLATES,
  KOL_MEETING_SECTION_TEMPLATES,
  type MockReportSectionId,
  type MockReportWorkflowId,
} from "@/domain/workflow-studio/mock-report";

export const AGENT_FOLLOW_UP_DEMO_LABEL =
  "Demo follow-up tasks — browser session/local persistence only. Not a production work queue.";

export const AGENT_FOLLOW_UP_STORAGE_KEY =
  "medintel.workflow-studio.agent-follow-up-tasks.v1";

export type AgentFollowUpTaskStatus = "open" | "done";

export type AgentFollowUpTask = {
  id: string;
  sectionId: MockReportSectionId | "custom";
  agentId: string;
  note: string;
  status: AgentFollowUpTaskStatus;
  createdAt: string;
  workflowId: MockReportWorkflowId;
  reportTitle?: string;
};

const sectionIdValues = [
  ...new Set([
    ...KOL_MEETING_SECTION_TEMPLATES.map((template) => template.id),
    ...MANAGER_EDUCATION_SECTION_TEMPLATES.map((template) => template.id),
    "custom" as const,
  ]),
] as [MockReportSectionId | "custom", ...(MockReportSectionId | "custom")[]];

export const createAgentFollowUpTaskInputSchema = z.object({
  sectionId: z.enum(sectionIdValues),
  agentId: z.string().min(1).max(80),
  note: z.string().min(1).max(500),
  workflowId: z.enum(["kol-meeting-prep", "manager-education"]),
  reportTitle: z.string().max(200).optional(),
});

export type CreateAgentFollowUpTaskInput = z.infer<
  typeof createAgentFollowUpTaskInputSchema
>;

export function createAgentFollowUpTaskId(): string {
  return `aft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAgentFollowUpTask(
  input: CreateAgentFollowUpTaskInput,
): AgentFollowUpTask {
  const parsed = createAgentFollowUpTaskInputSchema.parse(input);
  return {
    id: createAgentFollowUpTaskId(),
    sectionId: parsed.sectionId,
    agentId: parsed.agentId,
    note: parsed.note.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
    workflowId: parsed.workflowId,
    reportTitle: parsed.reportTitle?.trim() || undefined,
  };
}

export function sectionTitleFor(
  sectionId: MockReportSectionId | "custom",
): string {
  if (sectionId === "custom") return "Custom task";
  const all = [
    ...KOL_MEETING_SECTION_TEMPLATES,
    ...MANAGER_EDUCATION_SECTION_TEMPLATES,
  ];
  return all.find((template) => template.id === sectionId)?.title ?? sectionId;
}
