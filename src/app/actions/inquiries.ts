"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InquiryIntakeInput } from "@/domain/schemas";
import type { InquiryStatus } from "@/domain/types";
import { createInquiry, transitionInquiry } from "@/services/inquiries";
import { switchDemoUser } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";

export type ActionResult =
  | { ok: true; message: string; inquiryId?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createInquiryAction(
  input: InquiryIntakeInput,
): Promise<ActionResult> {
  try {
    const inquiry = await createInquiry(input);
    revalidatePath("/medical-information");
    revalidatePath("/dashboard");
    const modeNote =
      getRuntimeMode() === "demo"
        ? " (demo mode — not persisted)"
        : "";
    return {
      ok: true,
      message: `Inquiry ${inquiry.referenceCode} created${modeNote}.`,
      inquiryId: inquiry.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create inquiry";
    return { ok: false, message };
  }
}

export async function createInquiryAndRedirectAction(
  input: InquiryIntakeInput,
): Promise<ActionResult> {
  const result = await createInquiryAction(input);
  if (result.ok && result.inquiryId) {
    redirect(`/medical-information/inquiries/${result.inquiryId}`);
  }
  return result;
}

export async function transitionInquiryAction(input: {
  inquiryId: string;
  toStatus: InquiryStatus;
  comments?: string;
  responseDraft?: string;
}): Promise<ActionResult> {
  try {
    const inquiry = await transitionInquiry(input);
    revalidatePath(`/medical-information/inquiries/${inquiry.id}`);
    revalidatePath("/medical-information");
    revalidatePath("/dashboard");
    const modeNote =
      getRuntimeMode() === "demo"
        ? " (demo mode — not persisted)"
        : "";
    return {
      ok: true,
      message: `Status updated to ${inquiry.status}${modeNote}.`,
      inquiryId: inquiry.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update workflow";
    return { ok: false, message };
  }
}

export async function switchDemoUserAction(
  userId: string,
): Promise<ActionResult> {
  try {
    const user = await switchDemoUser(userId);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Switched demo identity to ${user.fullName} (${user.role}).`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to switch user";
    return { ok: false, message };
  }
}
