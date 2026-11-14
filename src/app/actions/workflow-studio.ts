"use server";

import { z } from "zod";
import {
  createAgentFollowUpTaskInputSchema,
  buildAgentFollowUpTask,
  type AgentFollowUpTask,
} from "@/domain/workflow-studio/agent-follow-up-tasks";
import type { SectionEvaluation } from "@/domain/workflow-studio/evaluation-walkthrough";
import {
  isMockReportWorkflowId,
  type GeneratedMockReport,
} from "@/domain/workflow-studio/mock-report";
import { requireUser } from "@/lib/security/require-user";
import { evaluateWalkthroughSection } from "@/services/workflow-studio/evaluation-walkthrough";
import {
  buildAllowlistedReportContext,
  generateWorkflowStudioMockReport,
} from "@/services/workflow-studio/mock-report";

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

const evaluateSectionInputSchema = z.object({
  workflowId: z.enum(["kol-meeting-prep", "manager-education"]),
  sectionId: z.string().min(1).max(80),
  sectionTitle: z.string().min(1).max(160),
  sectionBody: z.string().min(1).max(8000),
  agentId: z.string().min(1).max(80),
});

export type EvaluateSectionResult =
  | { ok: true; evaluation: SectionEvaluation }
  | { ok: false; error: string };

export async function evaluateWalkthroughSectionAction(
  raw: unknown,
): Promise<EvaluateSectionResult> {
  try {
    const parsed = evaluateSectionInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid section evaluation payload." };
    }

    const user = await requireUser({
      action: "workflow_studio.section_evaluation",
      resourceType: "workflow_studio",
      resourceId: parsed.data.workflowId,
    });

    const allowlistedContext = buildAllowlistedReportContext(
      parsed.data.workflowId,
    );

    const evaluation = await evaluateWalkthroughSection({
      user,
      sectionId: parsed.data.sectionId,
      sectionTitle: parsed.data.sectionTitle,
      sectionBody: parsed.data.sectionBody,
      agentId: parsed.data.agentId,
      allowlistedContext,
    });

    return { ok: true, evaluation };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to evaluate walkthrough section.";
    return { ok: false, error: message };
  }
}
