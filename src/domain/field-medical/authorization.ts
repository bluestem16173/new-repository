import type { UserRole } from "@/domain/types";

export function canManageFieldMedical(role: UserRole): boolean {
  return role === "admin" || role === "field_director" || role === "medical_reviewer";
}

export function canApproveReadiness(role: UserRole): boolean {
  return role === "admin" || role === "field_director" || role === "medical_reviewer";
}

/** Reviewer validation of provisional simulation evaluations (not auto-readiness). */
export function canValidateFmCompetency(role: UserRole): boolean {
  return role === "admin" || role === "field_director" || role === "medical_reviewer";
}

export function canMutateCoaching(role: UserRole): boolean {
  return role === "admin" || role === "field_director";
}

export function assertCanApproveReadiness(role: UserRole): void {
  if (!canApproveReadiness(role)) {
    throw new Error(
      "Only admin, field_director, or medical_reviewer may approve readiness.",
    );
  }
}

export function assertCanMutateCoaching(role: UserRole): void {
  if (!canMutateCoaching(role)) {
    throw new Error("Only admin or field_director may mutate coaching plans.");
  }
}

/** MSL actors cannot approve their own readiness. */
export function assertNotSelfApproval(params: {
  actorProfileId: string | null;
  mslProfileId: string | null;
}): void {
  if (
    params.actorProfileId &&
    params.mslProfileId &&
    params.actorProfileId === params.mslProfileId
  ) {
    throw new Error("MSL cannot self-approve readiness.");
  }
}
