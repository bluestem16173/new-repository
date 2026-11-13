import { assertSyntheticRuntime } from "@/lib/demo/guard";
import type {
  ProvisionalEvaluation,
  ResponseDraft,
  ScientificEvidenceDocument,
  ScientificEvidencePassage,
  SimulationScenario,
  SimulationSession,
} from "@/domain/scientific/types";

/**
 * Synthetic teaching corpus only.
 * These records are NOT real publications and must never be presented as such.
 */
export const SI_EVIDENCE_NOTICE =
  "Scientific Intelligence evidence in demo mode is illustrative/synthetic teaching content. It is not a real publication corpus, not source-verified literature, and not for clinical decision-making.";

export interface StoredSimulationEvaluation {
  id: string;
  sessionId: string;
  rubricVersion: string;
  provisional: true;
  reviewerValidated: boolean;
  reviewerName: string | null;
  validatedAt: string | null;
  evaluation: ProvisionalEvaluation;
  createdAt: string;
}

export interface ScientificStore {
  documents: ScientificEvidenceDocument[];
  passages: ScientificEvidencePassage[];
  drafts: ResponseDraft[];
  scenarios: SimulationScenario[];
  sessions: SimulationSession[];
  evaluations: StoredSimulationEvaluation[];
}

declare global {
  var __medintelScientificStore: ScientificStore | undefined;
}

function createScientificStore(): ScientificStore {
  const documents: ScientificEvidenceDocument[] = [
    {
      id: "si-doc-0001-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title:
        "[SYNTHETIC TEACHING DOC] Illustrative cardiovascular outcomes narrative template",
      doi: null,
      pmid: null,
      publicationDate: null,
      sourceUrl: null,
      sourceName: "MedIntel synthetic teaching corpus",
      version: "1",
      verificationStatus: "illustrative_synthetic",
      licenseNote:
        "Synthetic content created for portfolio demonstration. Not a real paper.",
      ingestedAt: "2026-03-01T12:00:00.000Z",
    },
    {
      id: "si-doc-0002-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      title:
        "[SYNTHETIC TEACHING DOC] Illustrative safety discussion boundaries template",
      doi: null,
      pmid: null,
      publicationDate: null,
      sourceUrl: null,
      sourceName: "MedIntel synthetic teaching corpus",
      version: "1",
      verificationStatus: "illustrative_synthetic",
      licenseNote:
        "Synthetic content created for portfolio demonstration. Not a real paper.",
      ingestedAt: "2026-03-01T12:00:00.000Z",
    },
    {
      id: "si-doc-0003-cccc-4ccc-8ccc-cccccccccccc",
      title:
        "[SYNTHETIC TEACHING DOC] Illustrative oncology evidence-interpretation checklist",
      doi: null,
      pmid: null,
      publicationDate: null,
      sourceUrl: null,
      sourceName: "MedIntel synthetic teaching corpus",
      version: "1",
      verificationStatus: "illustrative_synthetic",
      licenseNote:
        "Synthetic content created for portfolio demonstration. Not a real paper.",
      ingestedAt: "2026-03-01T12:00:00.000Z",
    },
  ];

  const passages: ScientificEvidencePassage[] = [
    {
      id: "si-pass-0001-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      documentId: documents[0].id,
      passageKey: "cv-01",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: When discussing cardiovascular outcomes in a teaching simulation, distinguish primary versus secondary endpoints, state the analysis population, and avoid extrapolating beyond the labeled indication.",
    },
    {
      id: "si-pass-0002-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      documentId: documents[0].id,
      passageKey: "cv-02",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: Absolute risk differences and relative risk reductions should not be mixed without stating both. If the source passage does not contain a statistic, do not invent one.",
    },
    {
      id: "si-pass-0003-cccc-4ccc-8ccc-cccccccccccc",
      documentId: documents[1].id,
      passageKey: "saf-01",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: Safety discussions should separate labeled adverse reactions from unverified anecdotes. Suspected adverse events require human medical assessment pathways and must not be auto-reported by software.",
    },
    {
      id: "si-pass-0004-dddd-4ddd-8ddd-dddddddddddd",
      documentId: documents[1].id,
      passageKey: "saf-02",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: If evidence is insufficient to answer a safety question, state uncertainty explicitly and escalate to Medical Information or safety colleagues per policy.",
    },
    {
      id: "si-pass-0005-eeee-4eee-8eee-eeeeeeeeeeee",
      documentId: documents[2].id,
      passageKey: "onc-01",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: Oncology evidence interpretation should identify study design, line of therapy, biomarker selection, and whether results are exploratory. Conflicting studies require balanced presentation without selectively omitting contrary findings.",
    },
    {
      id: "si-pass-0006-ffff-4fff-8fff-ffffffffffff",
      documentId: documents[2].id,
      passageKey: "onc-02",
      sectionLabel: "Teaching note",
      content:
        "SYNTHETIC: Off-label inquiries must be handled within compliance boundaries. Do not promote unapproved uses. Provide only labeled or company-approved medical information pathways when applicable.",
    },
  ];

  const scenarios: SimulationScenario[] = [
    {
      id: "si-scen-0001-1111-4111-8111-111111111111",
      code: "GM-TRIAL-01",
      title: "Interpreting a synthetic CV outcomes teaching scenario",
      category: "trial_interpretation",
      therapeuticArea: "general_medicine",
      hcpPersona:
        "Fictional cardiologist requesting clarity on primary endpoint framing (synthetic).",
      clinicalContext:
        "Synthetic clinic discussion about endpoint hierarchy for a fictional product.",
      learningObjectives: [
        "State endpoints without inventing statistics",
        "Cite only allowlisted teaching passages",
        "Acknowledge uncertainty",
      ],
      rubricVersion: "2026.1",
      scenarioVersion: "1",
      allowedEvidenceDocumentIds: [documents[0].id],
    },
    {
      id: "si-scen-0002-2222-4222-8222-222222222222",
      code: "INF-SAF-01",
      title: "Safety question with incomplete evidence",
      category: "safety",
      therapeuticArea: "inflammation",
      hcpPersona: "Fictional rheumatologist raising a safety concern (synthetic).",
      clinicalContext:
        "Synthetic inquiry where the correct action is escalation and uncertainty disclosure.",
      learningObjectives: [
        "Do not invent AE rates",
        "Escalate appropriately",
        "Avoid autonomous regulatory decisions",
      ],
      rubricVersion: "2026.1",
      scenarioVersion: "1",
      allowedEvidenceDocumentIds: [documents[1].id],
    },
    {
      id: "si-scen-0003-3333-4333-8333-333333333333",
      code: "ONC-CONF-01",
      title: "Conflicting oncology evidence discussion",
      category: "conflicting_evidence",
      therapeuticArea: "oncology",
      hcpPersona: "Fictional oncologist comparing two synthetic narratives.",
      clinicalContext:
        "Teaching scenario requiring balanced presentation of conflicting illustrative notes.",
      learningObjectives: [
        "Present conflicting notes without cherry-picking",
        "Avoid invented trial facts",
      ],
      rubricVersion: "2026.1",
      scenarioVersion: "1",
      allowedEvidenceDocumentIds: [documents[2].id],
    },
    {
      id: "si-scen-0004-4444-4444-8444-444444444444",
      code: "RD-OFF-01",
      title: "Off-label inquiry boundary",
      category: "off_label_inquiry",
      therapeuticArea: "rare_disease",
      hcpPersona: "Fictional rare-disease specialist asking about unapproved use.",
      clinicalContext:
        "Synthetic compliance-sensitive exchange; no promotion of unapproved uses.",
      learningObjectives: [
        "Stay within compliance boundaries",
        "Route to Medical Information when needed",
      ],
      rubricVersion: "2026.1",
      scenarioVersion: "1",
      allowedEvidenceDocumentIds: [documents[2].id],
    },
    {
      id: "si-scen-0005-5555-4555-8555-555555555555",
      code: "ONC-KOL-01",
      title: "Difficult KOL engagement",
      category: "difficult_kol_engagement",
      therapeuticArea: "oncology",
      hcpPersona: "Fictional KOL pressing for definitive claims beyond evidence.",
      clinicalContext:
        "Teaching scenario emphasizing uncertainty handling and non-promotional scientific exchange.",
      learningObjectives: [
        "Handle pressure without overstating evidence",
        "Flag critical inaccuracies if claims exceed sources",
      ],
      rubricVersion: "2026.1",
      scenarioVersion: "1",
      allowedEvidenceDocumentIds: [documents[2].id, documents[1].id],
    },
  ];

  return {
    documents,
    passages,
    drafts: [],
    scenarios,
    sessions: [],
    evaluations: [],
  };
}

export function getScientificStore(): ScientificStore {
  assertSyntheticRuntime();
  if (!globalThis.__medintelScientificStore) {
    globalThis.__medintelScientificStore = createScientificStore();
  }
  return globalThis.__medintelScientificStore;
}

export function resetScientificStore(): ScientificStore {
  globalThis.__medintelScientificStore = createScientificStore();
  return globalThis.__medintelScientificStore;
}
