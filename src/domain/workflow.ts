import type { InquiryStatus } from "@/domain/types";

/**
 * Allowed Medical Information inquiry lifecycle transitions.
 * Guards are enforced in services; UI should only offer valid next states.
 */
export const WORKFLOW_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  draft: ["submitted"],
  submitted: ["evidence_review", "rejected", "needs_revision"],
  evidence_review: ["response_drafted", "needs_revision", "rejected"],
  response_drafted: ["medical_review", "needs_revision"],
  medical_review: ["approved", "rejected", "needs_revision"],
  approved: ["closed"],
  needs_revision: ["submitted", "evidence_review", "response_drafted"],
  rejected: [],
  closed: [],
};

export const WORKFLOW_STATUS_LABELS: Record<InquiryStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  evidence_review: "Evidence Review",
  response_drafted: "Response Drafted",
  medical_review: "Medical Review",
  approved: "Approved",
  closed: "Closed",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
};

export function canTransition(
  from: InquiryStatus,
  to: InquiryStatus,
): boolean {
  return WORKFLOW_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(
  from: InquiryStatus,
): InquiryStatus[] {
  return [...WORKFLOW_TRANSITIONS[from]];
}

export function assertTransition(
  from: InquiryStatus,
  to: InquiryStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid workflow transition: ${from} → ${to}`,
    );
  }
}

export function isTerminalStatus(status: InquiryStatus): boolean {
  return status === "closed" || status === "rejected";
}

export function requiresResponseDraft(to: InquiryStatus): boolean {
  return to === "response_drafted" || to === "medical_review";
}
