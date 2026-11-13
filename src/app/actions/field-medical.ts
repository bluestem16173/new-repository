"use server";

import { revalidatePath } from "next/cache";
import {
  approveReadinessSchema,
  assignCoachingActivitySchema,
  completeCoachingActivitySchema,
  createCoachingPlanSchema,
} from "@/domain/field-medical/schemas";
import {
  assignCoachingActivity,
  completeCoachingActivity,
  createCoachingPlan,
  decideReadiness,
} from "@/services/field-medical/mutations";
import { resetFieldMedicalDemoStore } from "@/services/field-medical/store";

export type FmActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

function revalidateFm() {
  revalidatePath("/field-medical");
  revalidatePath("/field-medical/msls");
  revalidatePath("/field-medical/coaching");
  revalidatePath("/field-medical/competencies");
  revalidatePath("/field-medical/analytics");
}

export async function createCoachingPlanAction(
  input: unknown,
): Promise<FmActionResult> {
  try {
    const parsed = createCoachingPlanSchema.parse(input);
    const plan = await createCoachingPlan(parsed);
    revalidateFm();
    revalidatePath(`/field-medical/msls/${plan.mslId}`);
    revalidatePath(`/field-medical/coaching/${plan.id}`);
    return {
      ok: true,
      message: "Coaching plan created (demo mode — in-memory only).",
      id: plan.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create plan",
    };
  }
}

export async function assignCoachingActivityAction(
  input: unknown,
): Promise<FmActionResult> {
  try {
    const parsed = assignCoachingActivitySchema.parse(input);
    const activity = await assignCoachingActivity(parsed);
    revalidateFm();
    return {
      ok: true,
      message: "Coaching activity assigned (demo mode — in-memory only).",
      id: activity.id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to assign activity",
    };
  }
}

export async function completeCoachingActivityAction(
  input: unknown,
): Promise<FmActionResult> {
  try {
    const parsed = completeCoachingActivitySchema.parse(input);
    const activity = await completeCoachingActivity(parsed);
    revalidateFm();
    return {
      ok: true,
      message: "Coaching activity completed and audited (demo mode).",
      id: activity.id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to complete activity",
    };
  }
}

export async function decideReadinessAction(
  input: unknown,
): Promise<FmActionResult> {
  try {
    const parsed = approveReadinessSchema.parse(input);
    const decision = await decideReadiness(parsed);
    revalidateFm();
    revalidatePath(`/field-medical/msls/${decision.mslId}`);
    return {
      ok: true,
      message: `Readiness ${decision.outcome} recorded (demo mode).`,
      id: decision.id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to record readiness",
    };
  }
}

export async function resetFieldMedicalSeedAction(): Promise<FmActionResult> {
  try {
    await resetFieldMedicalDemoStore();
    revalidateFm();
    return { ok: true, message: "Field Medical demo seed reset." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Reset failed",
    };
  }
}
