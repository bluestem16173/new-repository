export type EvidenceVerificationStatus =
  | "unverified"
  | "illustrative_synthetic"
  | "source_verified"
  | "rejected";

export type ClaimReviewStatus =
  | "pending"
  | "supported"
  | "needs_revision"
  | "unsupported";

export type SimulationCategory =
  | "trial_interpretation"
  | "safety"
  | "conflicting_evidence"
  | "off_label_inquiry"
  | "difficult_kol_engagement";

export const SIMULATION_CATEGORY_LABELS: Record<SimulationCategory, string> = {
  trial_interpretation: "Trial interpretation",
  safety: "Safety",
  conflicting_evidence: "Conflicting evidence",
  off_label_inquiry: "Off-label inquiry",
  difficult_kol_engagement: "Difficult KOL engagement",
};

export interface ScientificEvidenceDocument {
  id: string;
  title: string;
  doi: string | null;
  pmid: string | null;
  publicationDate: string | null;
  sourceUrl: string | null;
  sourceName: string;
  version: string;
  verificationStatus: EvidenceVerificationStatus;
  licenseNote: string | null;
  ingestedAt: string;
}

export interface ScientificEvidencePassage {
  id: string;
  documentId: string;
  passageKey: string;
  sectionLabel: string | null;
  content: string;
}

export interface RetrievalHit {
  document: ScientificEvidenceDocument;
  passage: ScientificEvidencePassage;
  rankScore: number;
}

export interface RetrievalResult {
  query: string;
  hits: RetrievalHit[];
  noEvidence: boolean;
  runId: string;
}

export interface ResponseClaim {
  id: string;
  draftId: string;
  claimKey: string;
  claimText: string;
  citationPassageIds: string[];
  status: ClaimReviewStatus;
  reviewerNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ResponseDraft {
  id: string;
  inquiryId: string;
  draftVersion: number;
  evidenceDocumentVersions: Array<{ documentId: string; version: string }>;
  draftText: string;
  uncertaintyNotes: string | null;
  limitationsNotes: string | null;
  missingEvidenceNotes: string | null;
  safetyEventFlag: boolean;
  createdByRole: string | null;
  createdAt: string;
  claims: ResponseClaim[];
}

export interface SimulationScenario {
  id: string;
  code: string;
  title: string;
  category: SimulationCategory;
  therapeuticArea:
    | "oncology"
    | "inflammation"
    | "rare_disease"
    | "general_medicine";
  hcpPersona: string;
  clinicalContext: string;
  learningObjectives: string[];
  rubricVersion: string;
  scenarioVersion: string;
  allowedEvidenceDocumentIds: string[];
}

export interface SimulationTurn {
  id: string;
  sessionId: string;
  turnIndex: number;
  speaker: "msl" | "hcp" | "system";
  content: string;
  citedPassageIds: string[];
  createdAt: string;
}

export interface SimulationSession {
  id: string;
  scenarioId: string;
  mslId: string | null;
  status: "in_progress" | "completed" | "abandoned";
  scenarioVersion: string;
  startedAt: string;
  completedAt: string | null;
  turns: SimulationTurn[];
}

export interface ProvisionalEvaluation {
  scientificAccuracy: number;
  evidenceInterpretation: number;
  compliance: number;
  communication: number;
  uncertaintyHandling: number;
  criticalInaccuracyFlags: string[];
  notes: string;
}
