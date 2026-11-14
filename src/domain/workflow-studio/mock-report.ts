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

export interface GeneratedMockReport {
  workflowId: MockReportWorkflowId;
  title: string;
  body: string;
  source: "openai" | "fixture_compose";
  oversightLabel: string;
  generatedAt: string;
}
