"use server";

import {
  createAgentFollowUpTaskInputSchema,
  buildAgentFollowUpTask,
  type AgentFollowUpTask,
} from "@/domain/workflow-studio/agent-follow-up-tasks";
import {
  isMockReportWorkflowId,
  type GeneratedMockReport,
} from "@/domain/workflow-studio/mock-report";
import { requireUser } from "@/lib/security/require-user";
import { generateWorkflowStudioMockReport } from "@/services/workflow-studio/mock-report";

export type GenerateMockReportResult =
  | { ok: true; report: GeneratedMockReport }
  | { ok: false; error: string };

export async function generateWorkflowStudioMockReportAction(
  workflowId: string,
): Promise<GenerateMockReportResult> {
  try {
    if (!isMockReportWorkflowId(workflowId)) {
      return {
        ok: false,
        error:
          "Mock report generation is only available for KOL Meeting Prep and Manager Education.",
      };
    }

    const user = await requireUser({
      action: "workflow_studio.mock_report",
      resourceType: "workflow_studio",
      resourceId: workflowId,
    });

    const report = await generateWorkflowStudioMockReport({
      workflowId,
      user,
    });

    return { ok: true, report };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate mock report.";
    return { ok: false, error: message };
  }
}

export type CreateFollowUpTaskResult =
  | { ok: true; task: AgentFollowUpTask }
  | { ok: false; error: string };

/** Validates and stamps a demo follow-up task. Client persists to localStorage. */
export async function createAgentFollowUpTaskAction(
  raw: unknown,
): Promise<CreateFollowUpTaskResult> {
  try {
    const parsed = createAgentFollowUpTaskInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid follow-up task payload." };
    }

    await requireUser({
      action: "workflow_studio.follow_up_task",
      resourceType: "workflow_studio",
      resourceId: parsed.data.workflowId,
    });

    return { ok: true, task: buildAgentFollowUpTask(parsed.data) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create follow-up task.";
    return { ok: false, error: message };
  }
}
