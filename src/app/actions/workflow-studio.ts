"use server";

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
