import type { InquiryStatus, UserRole } from "@/domain/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  medical_reviewer: "Medical Reviewer",
  medical_information_specialist: "Medical Information Specialist",
  msl: "MSL",
  field_director: "Field Director",
};

/** Roles that may approve or reject during medical_review. */
export const APPROVER_ROLES: readonly UserRole[] = [
  "admin",
  "medical_reviewer",
] as const;

export function isApproverRole(role: UserRole): boolean {
  return APPROVER_ROLES.includes(role);
}

export function canCreateInquiry(role: UserRole): boolean {
  return (
    role === "admin" ||
    role === "medical_information_specialist" ||
    role === "msl" ||
    role === "medical_reviewer"
  );
}

export function canEditDraft(role: UserRole): boolean {
  return canCreateInquiry(role);
}

export function canAdvanceWorkflow(
  role: UserRole,
  from: InquiryStatus,
  to: InquiryStatus,
): boolean {
  if (role === "admin") {
    return true;
  }

  if (to === "approved") {
    return isApproverRole(role);
  }

  if (from === "medical_review" && to === "rejected") {
    return isApproverRole(role);
  }

  if (role === "medical_reviewer") {
    return (
      to === "needs_revision" ||
      to === "rejected" ||
      to === "medical_review" ||
      from === "medical_review"
    );
  }

  if (role === "medical_information_specialist") {
    return (
      to === "submitted" ||
      to === "evidence_review" ||
      to === "response_drafted" ||
      to === "medical_review" ||
      to === "needs_revision" ||
      to === "closed"
    );
  }

  if (role === "msl") {
    return to === "submitted" || to === "needs_revision";
  }

  return false;
}

export function canApproveInquiry(role: UserRole): boolean {
  return isApproverRole(role);
}

export function canViewAudit(role: UserRole): boolean {
  return (
    role === "admin" ||
    role === "medical_reviewer" ||
    role === "medical_information_specialist" ||
    role === "field_director"
  );
}

export function assertCanApprove(role: UserRole): void {
  if (!canApproveInquiry(role)) {
    throw new Error(
      "Only medical_reviewer or admin may approve medical information responses.",
    );
  }
}

export function assertCanTransition(
  role: UserRole,
  from: InquiryStatus,
  to: InquiryStatus,
): void {
  if (!canAdvanceWorkflow(role, from, to)) {
    throw new Error(
      `Role "${role}" is not authorized to transition ${from} → ${to}.`,
    );
  }
}
