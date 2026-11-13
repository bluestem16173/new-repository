import { randomUUID } from "crypto";
import {
  assertCanApprove,
  assertCanTransition,
  canCreateInquiry,
} from "@/domain/authorization";
import {
  inquiryIntakeSchema,
  type InquiryIntakeInput,
  type WorkflowTransitionInput,
  workflowTransitionSchema,
} from "@/domain/schemas";
import type {
  AuditEvent,
  InquiryStatus,
  InquiryWithRelations,
  MedicalInquiry,
  ReviewDecision,
  User,
} from "@/domain/types";
import {
  assertTransition,
  WORKFLOW_STATUS_LABELS,
} from "@/domain/workflow";
import {
  getDemoStore,
  hydrateInquiry,
} from "@/lib/demo/seed";
import { getRuntimeMode } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization, getCurrentUser } from "@/lib/session";

function nextReferenceCode(existing: MedicalInquiry[]): string {
  const year = new Date().getUTCFullYear();
  const seq =
    existing
      .map((i) => {
        const match = /^MI-(\d{4})-(\d+)$/.exec(i.referenceCode);
        if (!match || Number(match[1]) !== year) return 0;
        return Number(match[2]);
      })
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  return `MI-${year}-${String(seq).padStart(4, "0")}`;
}

function mapInquiryRow(row: Record<string, unknown>): MedicalInquiry {
  return {
    id: row.id as string,
    referenceCode: row.reference_code as string,
    title: row.title as string,
    questionText: row.question_text as string,
    productName: row.product_name as string,
    therapeuticArea: row.therapeutic_area as string,
    requesterType: row.requester_type as MedicalInquiry["requesterType"],
    requesterName: row.requester_name as string,
    requesterOrganization: (row.requester_organization as string | null) ?? null,
    channel: row.channel as MedicalInquiry["channel"],
    priority: row.priority as MedicalInquiry["priority"],
    status: row.status as MedicalInquiry["status"],
    assignedToId: (row.assigned_to_id as string | null) ?? null,
    createdById: row.created_by_id as string,
    responseDraft: (row.response_draft as string | null) ?? null,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
    revisionNotes: (row.revision_notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    submittedAt: (row.submitted_at as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
  };
}

async function appendAudit(
  event: Omit<AuditEvent, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): Promise<AuditEvent> {
  const record: AuditEvent = {
    id: event.id ?? randomUUID(),
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    actorId: event.actorId,
    actorRole: event.actorRole,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    metadata: event.metadata,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };

  if (getRuntimeMode() === "demo") {
    getDemoStore().auditEvents.push(record);
    return record;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    getDemoStore().auditEvents.push(record);
    return record;
  }

  const { error } = await supabase.from("audit_events").insert({
    id: record.id,
    entity_type: record.entityType,
    entity_id: record.entityId,
    action: record.action,
    actor_id: record.actorId,
    actor_role: record.actorRole,
    from_status: record.fromStatus,
    to_status: record.toStatus,
    metadata: record.metadata,
    created_at: record.createdAt,
  });

  if (error) {
    throw new Error(`Failed to write audit event: ${error.message}`);
  }

  return record;
}

export async function listInquiries(): Promise<MedicalInquiry[]> {
  if (getRuntimeMode() === "demo") {
    return [...getDemoStore().inquiries].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [...getDemoStore().inquiries];
  }

  const { data, error } = await supabase
    .from("medical_inquiries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list inquiries: ${error.message}`);
  }

  return (data ?? []).map((row) => mapInquiryRow(row as Record<string, unknown>));
}

export async function getInquiryById(
  id: string,
): Promise<InquiryWithRelations | null> {
  if (getRuntimeMode() === "demo") {
    const inquiry = getDemoStore().inquiries.find((i) => i.id === id);
    return inquiry ? hydrateInquiry(inquiry) : null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const inquiry = getDemoStore().inquiries.find((i) => i.id === id);
    return inquiry ? hydrateInquiry(inquiry) : null;
  }

  const { data: row, error } = await supabase
    .from("medical_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load inquiry: ${error.message}`);
  }
  if (!row) return null;

  const inquiry = mapInquiryRow(row as Record<string, unknown>);

  const [citationResult, reviewResult, auditResult] =
    await Promise.all([
      supabase
        .from("evidence_citations")
        .select("*, document:evidence_documents(*)")
        .eq("inquiry_id", id),
      supabase
        .from("review_decisions")
        .select("*")
        .eq("inquiry_id", id)
        .order("decided_at", { ascending: false }),
      supabase
        .from("audit_events")
        .select("*")
        .eq("entity_type", "medical_inquiry")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
    ]);
  for (const result of [citationResult, reviewResult, auditResult]) {
    if (result.error) throw new Error("Could not load inquiry evidence, review, or audit records.");
  }
  const { data: citations } = citationResult;
  const { data: reviews } = reviewResult;
  const { data: auditEvents } = auditResult;

  return {
    ...inquiry,
    citations: (citations ?? []).map((c) => {
      const citation = c as Record<string, unknown>;
      const document = citation.document as Record<string, unknown>;
      return {
        id: citation.id as string,
        inquiryId: citation.inquiry_id as string,
        evidenceDocumentId: citation.evidence_document_id as string,
        relevanceNote: (citation.relevance_note as string | null) ?? null,
        createdById: citation.created_by_id as string,
        createdAt: citation.created_at as string,
        document: {
          id: document.id as string,
          title: document.title as string,
          sourceName: document.source_name as string,
          sourceUrl: (document.source_url as string | null) ?? null,
          publicationYear: (document.publication_year as number | null) ?? null,
          authors: (document.authors as string | null) ?? null,
          abstractSummary: (document.abstract_summary as string | null) ?? null,
          trustLabel: document.trust_label as
            | "illustrative_unverified"
            | "internally_validated"
            | "planned",
          createdAt: document.created_at as string,
          updatedAt: document.updated_at as string,
        },
      };
    }),
    reviews: (reviews ?? []).map((r) => {
      const review = r as Record<string, unknown>;
      return {
        id: review.id as string,
        inquiryId: review.inquiry_id as string,
        reviewerId: review.reviewer_id as string,
        outcome: review.outcome as ReviewDecision["outcome"],
        comments: (review.comments as string | null) ?? null,
        decidedAt: review.decided_at as string,
      };
    }),
    auditEvents: (auditEvents ?? []).map((e) => {
      const event = e as Record<string, unknown>;
      return {
        id: event.id as string,
        entityType: event.entity_type as string,
        entityId: event.entity_id as string,
        action: event.action as string,
        actorId: (event.actor_id as string | null) ?? null,
        actorRole: (event.actor_role as User["role"] | null) ?? null,
        fromStatus:
          (event.from_status as MedicalInquiry["status"] | null) ?? null,
        toStatus: (event.to_status as MedicalInquiry["status"] | null) ?? null,
        metadata: (event.metadata as Record<string, unknown> | null) ?? null,
        createdAt: event.created_at as string,
      };
    }),
  };
}

export async function createInquiry(
  rawInput: InquiryIntakeInput,
): Promise<MedicalInquiry> {
  const user = await getCurrentUser();
  if (!canCreateInquiry(user.role)) {
    throw new Error("You are not authorized to create medical inquiries.");
  }

  const input = inquiryIntakeSchema.parse(rawInput);
  const now = new Date().toISOString();
  const status = input.submitImmediately ? "submitted" : "draft";

  if (getRuntimeMode() === "demo") {
    const store = getDemoStore();
    const inquiry: MedicalInquiry = {
      id: randomUUID(),
      referenceCode: nextReferenceCode(store.inquiries),
      title: input.title,
      questionText: input.questionText,
      productName: input.productName,
      therapeuticArea: input.therapeuticArea,
      requesterType: input.requesterType,
      requesterName: input.requesterName,
      requesterOrganization: input.requesterOrganization || null,
      channel: input.channel,
      priority: input.priority,
      status,
      assignedToId: user.id,
      createdById: user.id,
      responseDraft: null,
      rejectionReason: null,
      revisionNotes: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: status === "submitted" ? now : null,
      closedAt: null,
    };
    store.inquiries.unshift(inquiry);
    await appendAudit({
      entityType: "medical_inquiry",
      entityId: inquiry.id,
      action: status === "submitted" ? "inquiry_submitted" : "inquiry_created",
      actorId: user.id,
      actorRole: user.role,
      fromStatus: null,
      toStatus: status,
      metadata: { referenceCode: inquiry.referenceCode, persisted: false },
    });
    return inquiry;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const organization = await getCurrentUserOrganization();
  if (organization.error || !organization.organizationId) throw new Error("Organization membership required.");
  // UUID suffix avoids races and cross-tenant collisions from RLS-filtered counts.
  const referenceCode = `MI-${new Date().getUTCFullYear()}-${randomUUID()}`;

  const { data, error } = await supabase
    .from("medical_inquiries")
    .insert({
      reference_code: referenceCode,
      organization_id: organization.organizationId,
      title: input.title,
      question_text: input.questionText,
      product_name: input.productName,
      therapeutic_area: input.therapeuticArea,
      requester_type: input.requesterType,
      requester_name: input.requesterName,
      requester_organization: input.requesterOrganization || null,
      channel: input.channel,
      priority: input.priority,
      status,
      assigned_to_id: user.id,
      created_by_id: user.id,
      submitted_at: status === "submitted" ? now : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create inquiry: ${error?.message ?? "unknown"}`);
  }

  const inquiry = mapInquiryRow(data as Record<string, unknown>);
  await appendAudit({
    entityType: "medical_inquiry",
    entityId: inquiry.id,
    action: status === "submitted" ? "inquiry_submitted" : "inquiry_created",
    actorId: user.id,
    actorRole: user.role,
    fromStatus: null,
    toStatus: status,
    metadata: { referenceCode: inquiry.referenceCode },
  });
  return inquiry;
}

export async function transitionInquiry(
  rawInput: WorkflowTransitionInput,
): Promise<MedicalInquiry> {
  const user = await getCurrentUser();
  const input = workflowTransitionSchema.parse(rawInput);

  const existing = await getInquiryById(input.inquiryId);
  if (!existing) {
    throw new Error("Inquiry not found");
  }

  assertTransition(existing.status, input.toStatus);
  assertCanTransition(user.role, existing.status, input.toStatus);

  if (input.toStatus === "approved") {
    assertCanApprove(user.role);
    if (existing.createdById === user.id) throw new Error("Authors cannot approve their own responses.");
  }

  if (
    (input.toStatus === "response_drafted" ||
      input.toStatus === "medical_review") &&
    !input.responseDraft &&
    !existing.responseDraft
  ) {
    throw new Error("A response draft is required before this transition.");
  }

  const now = new Date().toISOString();
  const updates: Partial<MedicalInquiry> = {
    status: input.toStatus,
    updatedAt: now,
  };

  if (input.responseDraft) {
    updates.responseDraft = input.responseDraft;
  }
  if (input.toStatus === "submitted" && !existing.submittedAt) {
    updates.submittedAt = now;
  }
  if (input.toStatus === "closed") {
    updates.closedAt = now;
  }
  if (input.toStatus === "rejected") {
    updates.rejectionReason = input.comments ?? "Rejected";
  }
  if (input.toStatus === "needs_revision") {
    updates.revisionNotes = input.comments ?? "Revision requested";
  }

  if (getRuntimeMode() === "demo") {
    const store = getDemoStore();
    const index = store.inquiries.findIndex((i) => i.id === existing.id);
    if (index < 0) throw new Error("Inquiry not found in demo store");
    const updated: MedicalInquiry = {
      ...store.inquiries[index],
      ...updates,
    };
    store.inquiries[index] = updated;

    if (
      input.toStatus === "approved" ||
      input.toStatus === "rejected" ||
      input.toStatus === "needs_revision"
    ) {
      const review: ReviewDecision = {
        id: randomUUID(),
        inquiryId: updated.id,
        reviewerId: user.id,
        outcome:
          input.toStatus === "approved"
            ? "approved"
            : input.toStatus === "rejected"
              ? "rejected"
              : "needs_revision",
        comments: input.comments ?? null,
        decidedAt: now,
      };
      store.reviews.unshift(review);
    }

    await appendAudit({
      entityType: "medical_inquiry",
      entityId: updated.id,
      action: "status_transition",
      actorId: user.id,
      actorRole: user.role,
      fromStatus: existing.status,
      toStatus: input.toStatus,
      metadata: {
        comments: input.comments ?? null,
        persisted: false,
      },
    });
    return updated;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase
    .from("medical_inquiries")
    .update({
      status: updates.status,
      response_draft: updates.responseDraft ?? existing.responseDraft,
      rejection_reason: updates.rejectionReason ?? existing.rejectionReason,
      revision_notes: updates.revisionNotes ?? existing.revisionNotes,
      submitted_at: updates.submittedAt ?? existing.submittedAt,
      closed_at: updates.closedAt ?? existing.closedAt,
      updated_at: now,
    })
    .eq("id", existing.id)
    .eq("status", existing.status)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to transition inquiry: ${error?.message ?? "unknown"}`,
    );
  }

  if (
    input.toStatus === "approved" ||
    input.toStatus === "rejected" ||
    input.toStatus === "needs_revision"
  ) {
    const { error: reviewError } = await supabase
      .from("review_decisions")
      .insert({
        inquiry_id: existing.id,
        reviewer_id: user.id,
        outcome:
          input.toStatus === "approved"
            ? "approved"
            : input.toStatus === "rejected"
              ? "rejected"
              : "needs_revision",
        comments: input.comments ?? null,
        decided_at: now,
      });
    if (reviewError) {
      throw new Error(`Failed to record review: ${reviewError.message}`);
    }
  }

  const inquiry = mapInquiryRow(data as Record<string, unknown>);
  await appendAudit({
    entityType: "medical_inquiry",
    entityId: inquiry.id,
    action: "status_transition",
    actorId: user.id,
    actorRole: user.role,
    fromStatus: existing.status,
    toStatus: input.toStatus,
    metadata: { comments: input.comments ?? null },
  });
  return inquiry;
}

export async function getDashboardMetrics(): Promise<{
  openInquiries: number;
  inMedicalReview: number;
  approved: number;
  needsRevision: number;
}> {
  const overview = await getDashboardOverview();
  return {
    openInquiries: overview.openInquiries,
    inMedicalReview: overview.pendingMedicalReview,
    approved: overview.approvedResponses,
    needsRevision: overview.needsRevision,
  };
}

export interface WorkflowStatusCount {
  status: InquiryStatus;
  label: string;
  count: number;
}

export interface DashboardOverview {
  openInquiries: number;
  pendingMedicalReview: number;
  approvedResponses: number;
  needsRevision: number;
  /** Average days from submission to approval when review timestamps exist; otherwise null. */
  averageReviewTurnaroundDays: number | null;
  averageReviewTurnaroundSampleSize: number;
  statusDistribution: WorkflowStatusCount[];
  needsAttention: MedicalInquiry[];
  recentInquiries: MedicalInquiry[];
  totalInquiries: number;
}

async function listReviewDecisions(): Promise<ReviewDecision[]> {
  if (getRuntimeMode() === "demo") {
    return [...getDemoStore().reviews];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [...getDemoStore().reviews];
  }

  const { data, error } = await supabase
    .from("review_decisions")
    .select("*")
    .order("decided_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list review decisions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const review = row as Record<string, unknown>;
    return {
      id: review.id as string,
      inquiryId: review.inquiry_id as string,
      reviewerId: review.reviewer_id as string,
      outcome: review.outcome as ReviewDecision["outcome"],
      comments: (review.comments as string | null) ?? null,
      decidedAt: review.decided_at as string,
    };
  });
}

function computeAverageReviewTurnaroundDays(
  inquiries: MedicalInquiry[],
  reviews: ReviewDecision[],
): { days: number | null; sampleSize: number } {
  const inquiryById = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const durations: number[] = [];

  for (const review of reviews) {
    if (review.outcome !== "approved") continue;
    const inquiry = inquiryById.get(review.inquiryId);
    if (!inquiry?.submittedAt) continue;

    const submittedMs = new Date(inquiry.submittedAt).getTime();
    const decidedMs = new Date(review.decidedAt).getTime();
    if (
      Number.isNaN(submittedMs) ||
      Number.isNaN(decidedMs) ||
      decidedMs < submittedMs
    ) {
      continue;
    }

    durations.push((decidedMs - submittedMs) / (1000 * 60 * 60 * 24));
  }

  if (durations.length === 0) {
    return { days: null, sampleSize: 0 };
  }

  const average =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return {
    days: Math.round(average * 10) / 10,
    sampleSize: durations.length,
  };
}

const ATTENTION_STATUSES: InquiryStatus[] = [
  "medical_review",
  "needs_revision",
  "response_drafted",
];

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [inquiries, reviews] = await Promise.all([
    listInquiries(),
    listReviewDecisions(),
  ]);

  const statusOrder: InquiryStatus[] = [
    "draft",
    "submitted",
    "evidence_review",
    "response_drafted",
    "medical_review",
    "approved",
    "needs_revision",
    "rejected",
    "closed",
  ];

  const counts = new Map<InquiryStatus, number>();
  for (const status of statusOrder) {
    counts.set(status, 0);
  }
  for (const inquiry of inquiries) {
    counts.set(inquiry.status, (counts.get(inquiry.status) ?? 0) + 1);
  }

  const statusDistribution: WorkflowStatusCount[] = statusOrder
    .map((status) => ({
      status,
      label: WORKFLOW_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    }))
    .filter((item) => item.count > 0);

  const attentionPriority = (status: InquiryStatus): number => {
    if (status === "medical_review") return 0;
    if (status === "needs_revision") return 1;
    if (status === "response_drafted") return 2;
    return 3;
  };

  const needsAttention = inquiries
    .filter((inquiry) => ATTENTION_STATUSES.includes(inquiry.status))
    .sort((a, b) => {
      const priorityDiff =
        attentionPriority(a.status) - attentionPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      const aAge = new Date(a.updatedAt).getTime();
      const bAge = new Date(b.updatedAt).getTime();
      return aAge - bAge;
    });

  const recentInquiries = [...inquiries]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 8);

  const turnaround = computeAverageReviewTurnaroundDays(inquiries, reviews);

  return {
    openInquiries: inquiries.filter(
      (inquiry) =>
        !["closed", "rejected", "approved"].includes(inquiry.status),
    ).length,
    pendingMedicalReview: counts.get("medical_review") ?? 0,
    approvedResponses: counts.get("approved") ?? 0,
    needsRevision: counts.get("needs_revision") ?? 0,
    averageReviewTurnaroundDays: turnaround.days,
    averageReviewTurnaroundSampleSize: turnaround.sampleSize,
    statusDistribution,
    needsAttention,
    recentInquiries,
    totalInquiries: inquiries.length,
  };
}
