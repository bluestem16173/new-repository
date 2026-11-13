import { assertSyntheticRuntime } from "@/lib/demo/guard";
import type {
  AuditEvent,
  EvidenceCitation,
  EvidenceDocument,
  InquiryWithRelations,
  MedicalInquiry,
  ReviewDecision,
  User,
} from "@/domain/types";

/** All demo entities are synthetic and exist only in-memory for this process. */
export const DEMO_MODE_NOTICE =
  "Demo mode: data is synthetic and in-memory only. Changes are not persisted across server restarts.";

export const demoUsers: User[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "alex.chen@demo.medintel.local",
    fullName: "Alex Chen",
    role: "medical_information_specialist",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "jordan.lee@demo.medintel.local",
    fullName: "Jordan Lee",
    role: "medical_reviewer",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "sam.patel@demo.medintel.local",
    fullName: "Sam Patel",
    role: "admin",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    email: "morgan.rivera@demo.medintel.local",
    fullName: "Morgan Rivera",
    role: "msl",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    email: "casey.nguyen@demo.medintel.local",
    fullName: "Casey Nguyen",
    role: "field_director",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    email: "taylor.brooks@demo.medintel.local",
    fullName: "Taylor Brooks",
    role: "msl",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
];

export const demoCurrentUserId = demoUsers[0].id;

export const demoEvidenceDocuments: EvidenceDocument[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title:
      "Illustrative metadata: Mechanism overview for fictional product AtheraLyn",
    sourceName: "Public label-style summary (synthetic)",
    sourceUrl: "https://example.com/illustrative/atheralyn-overview",
    publicationYear: 2024,
    authors: "Demo Authors et al.",
    abstractSummary:
      "ILLUSTRATIVE ONLY — not a real publication. Placeholder metadata describing a fictional cardiovascular therapy for portfolio demonstration.",
    trustLabel: "illustrative_unverified",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title:
      "Illustrative metadata: Safety narrative template for NeuvoPath (fictional)",
    sourceName: "Congress abstract template (synthetic)",
    sourceUrl: null,
    publicationYear: 2025,
    authors: "Demo Safety Working Group",
    abstractSummary:
      "ILLUSTRATIVE ONLY — fabricated for UX walkthrough. Do not use for clinical decisions.",
    trustLabel: "illustrative_unverified",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    title: "Planned: verified PubMed retrieval pipeline",
    sourceName: "MedIntel roadmap",
    sourceUrl: null,
    publicationYear: null,
    authors: null,
    abstractSummary:
      "PLANNED FEATURE — scientific retrieval will treat content as untrusted until medical review validates citations.",
    trustLabel: "planned",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
];

const baseInquiries: MedicalInquiry[] = [
  {
    id: "d1111111-1111-4111-8111-111111111101",
    referenceCode: "MI-2026-0001",
    title: "Dosing clarification for AtheraLyn in mild renal impairment",
    questionText:
      "What is the recommended dosing approach for AtheraLyn in adults with mild renal impairment (eGFR 60–89)? Looking for labeled guidance only.",
    productName: "AtheraLyn (fictional)",
    therapeuticArea: "Cardiovascular",
    requesterType: "hcp",
    requesterName: "Dr. Riley Thompson",
    requesterOrganization: "North Harbor Clinic (synthetic)",
    channel: "email",
    priority: "medium",
    status: "evidence_review",
    assignedToId: demoUsers[0].id,
    createdById: demoUsers[0].id,
    responseDraft: null,
    rejectionReason: null,
    revisionNotes: null,
    createdAt: "2026-03-01T14:20:00.000Z",
    updatedAt: "2026-03-02T09:10:00.000Z",
    submittedAt: "2026-03-01T15:00:00.000Z",
    closedAt: null,
  },
  {
    id: "d2222222-2222-4222-8222-222222222202",
    referenceCode: "MI-2026-0002",
    title: "Drug–drug interaction inquiry for NeuvoPath and SSRIs",
    questionText:
      "Is there labeled guidance regarding co-administration of NeuvoPath with commonly prescribed SSRIs? Requesting Medical Information response for HCP education.",
    productName: "NeuvoPath (fictional)",
    therapeuticArea: "Neurology",
    requesterType: "hcp",
    requesterName: "Dr. Avery Brooks",
    requesterOrganization: "Summit Neurology Group (synthetic)",
    channel: "portal",
    priority: "high",
    status: "medical_review",
    assignedToId: demoUsers[0].id,
    createdById: demoUsers[3].id,
    responseDraft:
      "DRAFT — not approved. Based on illustrative labeled language for this fictional product, co-administration considerations should be reviewed against the full prescribing information. This draft must not be released without medical reviewer approval.",
    rejectionReason: null,
    revisionNotes: null,
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-04T16:30:00.000Z",
    submittedAt: "2026-03-03T11:30:00.000Z",
    closedAt: null,
  },
  {
    id: "d3333333-3333-4333-8333-333333333303",
    referenceCode: "MI-2026-0003",
    title: "Storage conditions after first use — AtheraLyn pens",
    questionText:
      "What are the labeled storage requirements for AtheraLyn pens after first use, including temperature range and beyond-use dating?",
    productName: "AtheraLyn (fictional)",
    therapeuticArea: "Cardiovascular",
    requesterType: "hcp",
    requesterName: "Pharmacist Jamie Ortiz",
    requesterOrganization: "Lakeside Health System (synthetic)",
    channel: "phone",
    priority: "low",
    status: "approved",
    assignedToId: demoUsers[0].id,
    createdById: demoUsers[0].id,
    responseDraft:
      "Approved illustrative response for demo: Store according to labeled temperature guidance for this fictional product; discard after labeled beyond-use period. Not for clinical use.",
    rejectionReason: null,
    revisionNotes: null,
    createdAt: "2026-02-20T09:00:00.000Z",
    updatedAt: "2026-02-22T17:00:00.000Z",
    submittedAt: "2026-02-20T09:30:00.000Z",
    closedAt: null,
  },
];

const baseCitations: EvidenceCitation[] = [
  {
    id: "e1111111-1111-4111-8111-111111111111",
    inquiryId: baseInquiries[0].id,
    evidenceDocumentId: demoEvidenceDocuments[0].id,
    relevanceNote:
      "Illustrative mechanism overview linked for workflow demo only.",
    createdById: demoUsers[0].id,
    createdAt: "2026-03-02T09:00:00.000Z",
  },
  {
    id: "e2222222-2222-4222-8222-222222222222",
    inquiryId: baseInquiries[1].id,
    evidenceDocumentId: demoEvidenceDocuments[1].id,
    relevanceNote: "Illustrative safety narrative template — unverified.",
    createdById: demoUsers[0].id,
    createdAt: "2026-03-04T10:00:00.000Z",
  },
];

const baseReviews: ReviewDecision[] = [
  {
    id: "f1111111-1111-4111-8111-111111111111",
    inquiryId: baseInquiries[2].id,
    reviewerId: demoUsers[1].id,
    outcome: "approved",
    comments: "Demo approval of illustrative response. Not clinical content.",
    decidedAt: "2026-02-22T16:45:00.000Z",
  },
];

const baseAudit: AuditEvent[] = [
  {
    id: "a1111111-1111-4111-8111-111111111101",
    entityType: "medical_inquiry",
    entityId: baseInquiries[0].id,
    action: "status_transition",
    actorId: demoUsers[0].id,
    actorRole: "medical_information_specialist",
    fromStatus: "submitted",
    toStatus: "evidence_review",
    metadata: { note: "Moved to evidence review" },
    createdAt: "2026-03-02T09:10:00.000Z",
  },
  {
    id: "a2222222-2222-4222-8222-222222222202",
    entityType: "medical_inquiry",
    entityId: baseInquiries[1].id,
    action: "status_transition",
    actorId: demoUsers[0].id,
    actorRole: "medical_information_specialist",
    fromStatus: "response_drafted",
    toStatus: "medical_review",
    metadata: { note: "Submitted draft for medical review" },
    createdAt: "2026-03-04T16:30:00.000Z",
  },
  {
    id: "a3333333-3333-4333-8333-333333333303",
    entityType: "medical_inquiry",
    entityId: baseInquiries[2].id,
    action: "status_transition",
    actorId: demoUsers[1].id,
    actorRole: "medical_reviewer",
    fromStatus: "medical_review",
    toStatus: "approved",
    metadata: { note: "Approved illustrative response" },
    createdAt: "2026-02-22T16:45:00.000Z",
  },
];

interface DemoStore {
  users: User[];
  inquiries: MedicalInquiry[];
  evidenceDocuments: EvidenceDocument[];
  citations: EvidenceCitation[];
  reviews: ReviewDecision[];
  auditEvents: AuditEvent[];
  currentUserId: string;
}

declare global {
  var __medintelDemoStore: DemoStore | undefined;
}

function createInitialStore(): DemoStore {
  return {
    users: structuredClone(demoUsers),
    inquiries: structuredClone(baseInquiries),
    evidenceDocuments: structuredClone(demoEvidenceDocuments),
    citations: structuredClone(baseCitations),
    reviews: structuredClone(baseReviews),
    auditEvents: structuredClone(baseAudit),
    currentUserId: demoCurrentUserId,
  };
}

export function getDemoStore(): DemoStore {
  assertSyntheticRuntime();
  if (!globalThis.__medintelDemoStore) {
    globalThis.__medintelDemoStore = createInitialStore();
  }
  return globalThis.__medintelDemoStore;
}

export function resetDemoStore(): void {
  globalThis.__medintelDemoStore = createInitialStore();
}

export function getDemoCurrentUser(): User {
  const store = getDemoStore();
  const user = store.users.find((u) => u.id === store.currentUserId);
  if (!user) {
    throw new Error("Demo current user missing");
  }
  return user;
}

export function setDemoCurrentUser(userId: string): void {
  const store = getDemoStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("Unknown demo user");
  }
  store.currentUserId = userId;
}

export function hydrateInquiry(
  inquiry: MedicalInquiry,
): InquiryWithRelations {
  const store = getDemoStore();
  const citations = store.citations
    .filter((c) => c.inquiryId === inquiry.id)
    .map((c) => {
      const document = store.evidenceDocuments.find(
        (d) => d.id === c.evidenceDocumentId,
      );
      if (!document) {
        throw new Error("Missing evidence document for citation");
      }
      return { ...c, document };
    });
  const reviews = store.reviews.filter((r) => r.inquiryId === inquiry.id);
  const auditEvents = store.auditEvents
    .filter(
      (e) =>
        e.entityType === "medical_inquiry" && e.entityId === inquiry.id,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const createdBy = store.users.find((u) => u.id === inquiry.createdById);
  const assignedTo = inquiry.assignedToId
    ? store.users.find((u) => u.id === inquiry.assignedToId) ?? null
    : null;

  return {
    ...inquiry,
    citations,
    reviews,
    auditEvents,
    createdBy,
    assignedTo,
  };
}
