import type { UserRole } from "@/domain/types";
import { isApproverRole } from "@/domain/authorization";

export function canViewKnowledgeNetwork(role: UserRole): boolean {
  return (
    role === "admin" ||
    role === "medical_reviewer" ||
    role === "medical_information_specialist" ||
    role === "msl" ||
    role === "field_director"
  );
}

export function canCreateKnowledgeItem(role: UserRole): boolean {
  return (
    role === "admin" ||
    role === "medical_reviewer" ||
    role === "medical_information_specialist"
  );
}

export function canApproveKnowledgeItem(role: UserRole): boolean {
  return isApproverRole(role);
}

export function canRecordKnowledgeReuse(role: UserRole): boolean {
  return canViewKnowledgeNetwork(role);
}

export function canEditValueAssumptions(role: UserRole): boolean {
  return role === "admin" || role === "field_director";
}
