export type UserRole =
  | "admin"
  | "medical_reviewer"
  | "medical_information_specialist"
  | "msl"
  | "field_director";

export type InquiryStatus =
  | "draft"
  | "submitted"
  | "evidence_review"
  | "response_drafted"
  | "medical_review"
  | "approved"
  | "closed"
  | "rejected"
  | "needs_revision";

export type InquiryPriority = "low" | "medium" | "high" | "urgent";

export type InquiryChannel =
  | "email"
  | "phone"
  | "portal"
  | "congress"
  | "msl_field"
  | "other";

export type RequesterType =
  | "hcp"
  | "patient"
  | "caregiver"
  | "internal"
  | "other";

export type ReviewDecisionOutcome =
  | "approved"
  | "rejected"
  | "needs_revision";

export type EvidenceTrustLabel =
  | "illustrative_unverified"
  | "internally_validated"
  | "planned";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalInquiry {
  id: string;
  referenceCode: string;
  title: string;
  questionText: string;
  productName: string;
  therapeuticArea: string;
  requesterType: RequesterType;
  requesterName: string;
  requesterOrganization: string | null;
  channel: InquiryChannel;
  priority: InquiryPriority;
  status: InquiryStatus;
  assignedToId: string | null;
  createdById: string;
  responseDraft: string | null;
  rejectionReason: string | null;
  revisionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  closedAt: string | null;
}

export interface EvidenceDocument {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string | null;
  publicationYear: number | null;
  authors: string | null;
  abstractSummary: string | null;
  trustLabel: EvidenceTrustLabel;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceCitation {
  id: string;
  inquiryId: string;
  evidenceDocumentId: string;
  relevanceNote: string | null;
  createdById: string;
  createdAt: string;
}

export interface ReviewDecision {
  id: string;
  inquiryId: string;
  reviewerId: string;
  outcome: ReviewDecisionOutcome;
  comments: string | null;
  decidedAt: string;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorRole: UserRole | null;
  fromStatus: InquiryStatus | null;
  toStatus: InquiryStatus | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Field Medical module — planned capability types (not fully implemented in Phase 1). */
export interface Competency {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
}

export interface Simulation {
  id: string;
  title: string;
  competencyId: string;
  scenarioSummary: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  createdAt: string;
}

export interface CoachingPlan {
  id: string;
  mslUserId: string;
  coachUserId: string;
  focusAreas: string[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface InquiryWithRelations extends MedicalInquiry {
  citations: Array<EvidenceCitation & { document: EvidenceDocument }>;
  reviews: ReviewDecision[];
  auditEvents: AuditEvent[];
  createdBy?: User;
  assignedTo?: User | null;
}
