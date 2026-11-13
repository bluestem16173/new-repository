"use server";

import { revalidatePath } from "next/cache";
import {
  claimReviewSchema,
  simulationReplySchema,
  validateEvaluationSchema,
} from "@/domain/scientific/schemas";
import {
  completeSimulationSession,
  startSimulationSession,
  submitMslTurn,
  validateSimulationEvaluation,
} from "@/services/scientific/simulations";
import {
  createInquiryDraftFromEvidence,
  reviewClaim,
} from "@/services/scientific/medical-response";
import { getCurrentUser } from "@/lib/session";
import { canApproveInquiry } from "@/domain/authorization";
import { canValidateFmCompetency } from "@/domain/field-medical/authorization";

export type SiActionResult =
  | { ok: true; message: string; id?: string; payload?: unknown }
  | { ok: false; message: string };

export async function startSimulationAction(
  scenarioId: string,
): Promise<SiActionResult> {
  try {
    const session = await startSimulationSession(scenarioId);
    revalidatePath(`/field-medical/simulations/${scenarioId}`);
    return {
      ok: true,
      message: "Simulation session started (demo).",
      id: session.id,
      payload: session,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to start",
    };
  }
}

export async function replySimulationAction(
  input: unknown,
): Promise<SiActionResult> {
  try {
    const parsed = simulationReplySchema.parse(input);
    const session = await submitMslTurn(parsed);
    return {
      ok: true,
      message: "Turn recorded.",
      id: session.id,
      payload: session,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to reply",
    };
  }
}

export async function completeSimulationAction(
  sessionId: string,
): Promise<SiActionResult> {
  try {
    const result = await completeSimulationSession(sessionId);
    return {
      ok: true,
      message:
        "Provisional evaluation generated. Requires reviewer validation before competency attainment.",
      id: result.session.id,
      payload: result,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to complete",
    };
  }
}

export async function generateInquiryDraftAction(
  inquiryId: string,
  questionText: string,
): Promise<SiActionResult> {
  try {
    const draft = await createInquiryDraftFromEvidence(inquiryId, questionText);
    revalidatePath(`/medical-information/inquiries/${inquiryId}`);
    return {
      ok: true,
      message:
        "Provisional draft created from allowlisted evidence. Not approved or released.",
      id: draft.id,
      payload: draft,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Draft failed",
    };
  }
}

export async function reviewClaimAction(input: unknown): Promise<SiActionResult> {
  try {
    const user = await getCurrentUser();
    if (!canApproveInquiry(user.role)) {
      return {
        ok: false,
        message: "Only medical_reviewer or admin may review claims.",
      };
    }
    const parsed = claimReviewSchema.parse(input);
    const claim = reviewClaim({
      ...parsed,
      reviewerName: user.fullName,
    });
    revalidatePath("/medical-information");
    return {
      ok: true,
      message: `Claim marked ${claim.status}.`,
      id: claim.id,
      payload: claim,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Review failed",
    };
  }
}

export async function validateSimulationEvaluationAction(
  input: unknown,
): Promise<SiActionResult> {
  try {
    const user = await getCurrentUser();
    if (!canValidateFmCompetency(user.role) && !canApproveInquiry(user.role)) {
      return {
        ok: false,
        message:
          "Only field_director, medical_reviewer, or admin may validate simulation evaluations.",
      };
    }
    const parsed = validateEvaluationSchema.parse(input);
    const record = await validateSimulationEvaluation({
      evaluationId: parsed.evaluationId,
      approve: parsed.approve,
      reviewerName: user.fullName,
    });
    revalidatePath("/field-medical");
    revalidatePath("/field-medical/simulations");
    revalidatePath("/field-medical/analytics");
    return {
      ok: true,
      message: record.reviewerValidated
        ? "Evaluation validated by reviewer. Formal competency still requires coaching/readiness workflows — not auto-approved."
        : "Validation declined; provisional scores retained without formal attainment.",
      id: record.id,
      payload: record,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Validation failed",
    };
  }
}
