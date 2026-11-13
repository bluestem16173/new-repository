import agentsManifest from "../../../public/agents/agents.json";

export type AgentStatus = "active" | "in_development" | "planned";

export type AgentCategory =
  | "evidence"
  | "medical_information"
  | "field_medical"
  | "safety"
  | "operations";

export interface MedIntelAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AgentCategory;
  status: AgentStatus;
  route: string;
  workflowHref: string | null;
  responsibilities: string[];
  implementedCapabilities: string[];
  plannedCapabilities: string[];
  permittedTools: string[];
  reviewRequirements: string[];
}

const MANIFEST_IDS = new Set(
  (agentsManifest.agents as Array<{ id: string; icon: string }>).map((a) => a.id),
);

function iconFor(id: string): string {
  const entry = (agentsManifest.agents as Array<{ id: string; icon: string }>).find(
    (a) => a.id === id,
  );
  if (!entry) {
    throw new Error(`Missing agents.json entry for ${id}`);
  }
  return `/agents/${entry.icon}`;
}

/**
 * Centralized MedIntel agent registry.
 * Status reflects genuine implementation — Active only when a real workflow is functional.
 */
export const MEDINTEL_AGENTS: MedIntelAgent[] = [
  {
    id: "literature-scout",
    name: "Literature Scout",
    description:
      "Discovers public clinical publications and abstracts subject to licensing and access conditions.",
    icon: iconFor("literature-scout"),
    category: "evidence",
    status: "planned",
    route: "/agents/literature-scout",
    workflowHref: "/evidence",
    responsibilities: [
      "Ingest selected public trial publications and abstracts",
      "Capture DOI/PMID, dates, source URL, version, and verification status",
      "Never invent publications or statistics",
    ],
    implementedCapabilities: [
      "Evidence Library browse of illustrative/synthetic metadata",
    ],
    plannedCapabilities: [
      "Live licensed literature API ingestion",
      "Automated source licensing checks",
      "Scheduled watchlists for new publications",
    ],
    permittedTools: ["Evidence Library (read)", "SI document store (future write)"],
    reviewRequirements: [
      "Source verification before marking source_verified",
      "Human confirmation of license/access conditions",
    ],
  },
  {
    id: "evidence-analyst",
    name: "Evidence Analyst",
    description:
      "Retrieves allowlisted source passages with citation provenance and explicit no-evidence handling.",
    icon: iconFor("evidence-analyst"),
    category: "evidence",
    status: "in_development",
    route: "/agents/evidence-analyst",
    workflowHref: "/evidence",
    responsibilities: [
      "Keyword/full-text retrieval over allowlisted passages",
      "Return stable document and passage identifiers",
      "Treat retrieved content as untrusted input",
    ],
    implementedCapabilities: [
      "Keyword retrieval over synthetic teaching corpus",
      "Explicit no-evidence responses",
      "Passage display on Medical Information inquiry detail",
    ],
    plannedCapabilities: [
      "pgvector semantic retrieval when justified",
      "Live corpus connectivity",
    ],
    permittedTools: ["SI retrieval service", "Evidence Library"],
    reviewRequirements: [
      "Retrieved passages remain untrusted until medical review",
    ],
  },
  {
    id: "citation-auditor",
    name: "Citation Auditor",
    description:
      "Maps claims to citations and supports claim-level medical review statuses.",
    icon: iconFor("citation-auditor"),
    category: "medical_information",
    status: "in_development",
    route: "/agents/citation-auditor",
    workflowHref: "/medical-information",
    responsibilities: [
      "Claim-to-citation mapping",
      "Flag unsupported or invented quantitative claims",
      "Record reviewer identity and timestamps",
    ],
    implementedCapabilities: [
      "Claim statuses: pending, supported, needs_revision, unsupported",
      "Reviewer notes and identity on SI drafts",
    ],
    plannedCapabilities: [
      "Automated citation integrity scoring across live literature",
    ],
    permittedTools: ["SI claim review actions", "Inquiry audit timeline"],
    reviewRequirements: [
      "Only medical_reviewer or admin may change claim statuses",
      "No automatic external release",
    ],
  },
  {
    id: "medical-drafting",
    name: "Medical Drafting",
    description:
      "Drafts structured Medical Information responses grounded in retrieved evidence versions.",
    icon: iconFor("medical-drafting"),
    category: "medical_information",
    status: "in_development",
    route: "/agents/medical-drafting",
    workflowHref: "/medical-information",
    responsibilities: [
      "Generate provisional drafts with uncertainty and limitations",
      "Version evidence used by each AI output",
      "Never auto-approve or externally release",
    ],
    implementedCapabilities: [
      "Evidence-grounded provisional SI drafts on inquiry detail",
      "Uncertainty, limitations, and missing-evidence notes",
    ],
    plannedCapabilities: [
      "OpenAI-assisted drafting with server-side keys and cost controls",
    ],
    permittedTools: ["SI draft generator", "Inquiry workflow"],
    reviewRequirements: [
      "Human medical review required before approval",
      "Demo corpus labeled illustrative/synthetic",
    ],
  },
  {
    id: "inquiry-triage",
    name: "Inquiry Triage",
    description:
      "Supports Medical Information intake, prioritization, and workflow advancement.",
    icon: iconFor("inquiry-triage"),
    category: "medical_information",
    status: "active",
    route: "/agents/inquiry-triage",
    workflowHref: "/medical-information",
    responsibilities: [
      "Inquiry intake and status lifecycle",
      "Priority and channel capture",
      "Audited workflow transitions",
    ],
    implementedCapabilities: [
      "Inquiry list, create, and detail workflow",
      "RBAC-guarded status transitions and approvals",
      "Audit timeline",
    ],
    plannedCapabilities: [
      "Automated priority suggestions from content signals",
    ],
    permittedTools: ["Inquiry workspace", "Workflow actions"],
    reviewRequirements: [
      "Approve restricted to medical_reviewer or admin",
    ],
  },
  {
    id: "kol-simulator",
    name: "KOL Simulator",
    description:
      "Runs interactive MSL/KOL scientific exchange simulations with allowlisted evidence.",
    icon: iconFor("kol-simulator"),
    category: "field_medical",
    status: "active",
    route: "/agents/kol-simulator",
    workflowHref: "/field-medical/simulations",
    responsibilities: [
      "Turn-based HCP teaching persona",
      "Challenging follow-ups without inventing study facts",
      "Persist transcripts, scenario versions, and evidence references",
    ],
    implementedCapabilities: [
      "Five scenario categories with simulation list/detail routes",
      "Deterministic allowlisted HCP turns",
      "Session transcript persistence in demo store",
    ],
    plannedCapabilities: [
      "OpenAI generative HCP constrained to allowlisted passages",
    ],
    permittedTools: ["Simulation sessions", "SI retrieval allowlists"],
    reviewRequirements: [
      "Provisional scores require qualified reviewer validation",
      "No auto-approval of readiness",
    ],
  },
  {
    id: "scientific-examiner",
    name: "Scientific Examiner",
    description:
      "Produces structured provisional competency evaluations for simulation sessions.",
    icon: iconFor("scientific-examiner"),
    category: "field_medical",
    status: "in_development",
    route: "/agents/scientific-examiner",
    workflowHref: "/field-medical/simulations",
    responsibilities: [
      "Score scientific accuracy, evidence interpretation, compliance, communication, uncertainty",
      "Flag critical inaccuracies independently of scores",
      "Require reviewer validation before formal attainment",
    ],
    implementedCapabilities: [
      "Zod-validated provisional evaluations",
      "Critical inaccuracy heuristics",
      "Reviewer validate/decline actions",
    ],
    plannedCapabilities: [
      "Direct write of validated assessments into competency records",
    ],
    permittedTools: ["Simulation evaluation service", "FM coaching (manual link)"],
    reviewRequirements: [
      "field_director, medical_reviewer, or admin for validation",
      "Critical flags block formal validation",
    ],
  },
  {
    id: "coaching-advisor",
    name: "Coaching Advisor",
    description:
      "Supports Field Medical coaching plans, assignments, and completion tracking.",
    icon: iconFor("coaching-advisor"),
    category: "field_medical",
    status: "active",
    route: "/agents/coaching-advisor",
    workflowHref: "/field-medical/coaching",
    responsibilities: [
      "Create and assign coaching activities",
      "Track on-time completion and overdue backlog",
      "Connect validated simulation gaps to coaching (manual)",
    ],
    implementedCapabilities: [
      "Coaching plan list/detail",
      "Create/assign/complete mutations with RBAC",
      "On-time coaching KPI",
    ],
    plannedCapabilities: [
      "Automated coaching recommendations from simulation gap patterns",
    ],
    permittedTools: ["Field Medical coaching workflows"],
    reviewRequirements: [
      "Coaching mutations limited to admin or field_director",
    ],
  },
  {
    id: "scenario-builder",
    name: "Scenario Builder",
    description:
      "Authors new MSL simulation scenarios, rubrics, and allowlisted evidence bindings.",
    icon: iconFor("scenario-builder"),
    category: "field_medical",
    status: "planned",
    route: "/agents/scenario-builder",
    workflowHref: "/field-medical/simulations",
    responsibilities: [
      "Create scenario categories, personas, and learning objectives",
      "Bind allowlisted evidence document versions",
      "Version rubrics",
    ],
    implementedCapabilities: [
      "Seeded scenario catalog (read-only)",
    ],
    plannedCapabilities: [
      "Authoring UI for new scenarios",
      "Rubric editor with Zod validation",
    ],
    permittedTools: ["Simulation catalog (read)"],
    reviewRequirements: [
      "Scenario publish requires Field Medical leadership review",
    ],
  },
  {
    id: "knowledge-matcher",
    name: "Scientific Knowledge Matching",
    description:
      "Ranks approved reusable knowledge against new scientific questions with Zod-validated applicability warnings — never invents matches or citations.",
    icon: iconFor("knowledge-matcher"),
    category: "evidence",
    status: "active",
    route: "/agents/knowledge-matcher",
    workflowHref: "/knowledge/search",
    responsibilities: [
      "Search approved knowledge with keyword/metadata filters",
      "Return structured match results or explicit no-supported-match",
      "Distinguish similarity from approved applicability",
    ],
    implementedCapabilities: [
      "Approved-knowledge keyword matching service",
      "Zod-validated match agent output",
      "Knowledge suggestions on Medical Information inquiry detail",
      "Knowledge Search workspace",
    ],
    plannedCapabilities: [
      "pgvector semantic matching when embeddings are configured",
      "Dedicated knowledge-matcher icon asset",
    ],
    permittedTools: [
      "Knowledge Network search",
      "Evidence Library (linked passages)",
      "Inquiry detail match panel",
    ],
    reviewRequirements: [
      "Human verification required before any external scientific use",
      "Never auto-send responses to HCPs",
    ],
  },
  {
    id: "evidence-watch",
    name: "Evidence Watch",
    description:
      "Monitors emerging evidence signals and surfaces changes for human assessment.",
    icon: iconFor("evidence-watch"),
    category: "evidence",
    status: "planned",
    route: "/agents/evidence-watch",
    workflowHref: "/evidence",
    responsibilities: [
      "Track updates to watched therapeutic topics",
      "Alert specialists without auto-changing approved responses",
    ],
    implementedCapabilities: [],
    plannedCapabilities: [
      "Watchlist configuration",
      "Change digests with source provenance",
    ],
    permittedTools: ["Evidence Library (future)"],
    reviewRequirements: [
      "Alerts are informational only until human assessment",
    ],
  },
  {
    id: "pharmacovigilance",
    name: "Pharmacovigilance Agent",
    description:
      "Detects safety-event language and routes content for human assessment — never autonomous reporting.",
    icon: iconFor("pharmacovigilance"),
    category: "safety",
    status: "in_development",
    route: "/agents/pharmacovigilance",
    workflowHref: "/medical-information",
    responsibilities: [
      "Flag potential safety-event language in inquiries/drafts",
      "Route to human medical assessment pathways",
      "Do not make autonomous regulatory reporting decisions",
    ],
    implementedCapabilities: [
      "Safety-event language detection on SI draft generation",
      "Human-assessment banner on inquiry detail",
    ],
    plannedCapabilities: [
      "Structured case intake handoff forms",
      "Integration with official PV case systems",
    ],
    permittedTools: ["SI draft safety flag", "Inquiry detail"],
    reviewRequirements: [
      "All safety flags require human assessment",
      "No autonomous regulatory submissions",
    ],
  },
  {
    id: "case-completeness",
    name: "Case Completeness",
    description:
      "Checks Medical Information cases for missing fields, evidence, and review steps.",
    icon: iconFor("case-completeness"),
    category: "operations",
    status: "planned",
    route: "/agents/case-completeness",
    workflowHref: "/medical-information",
    responsibilities: [
      "Detect incomplete inquiry packets",
      "Surface missing evidence or reviewer decisions",
    ],
    implementedCapabilities: [],
    plannedCapabilities: [
      "Completeness checklist on inquiry detail",
      "Queue aging tied to missing required fields",
    ],
    permittedTools: ["Inquiry workspace (future)"],
    reviewRequirements: [
      "Completeness suggestions are advisory",
    ],
  },
  {
    id: "bottleneck-analyst",
    name: "Bottleneck Analyst",
    description:
      "Surfaces Field Medical operational bottlenecks with thresholds, sample sizes, and drill-downs.",
    icon: iconFor("bottleneck-analyst"),
    category: "operations",
    status: "active",
    route: "/agents/bottleneck-analyst",
    workflowHref: "/field-medical/analytics",
    responsibilities: [
      "Evaluate readiness, coaching, and competency bottleneck rules",
      "Flag unstable samples",
      "Avoid causal productivity claims without comparison design",
    ],
    implementedCapabilities: [
      "FM analytics bottleneck findings",
      "KPI denominators and definitions",
      "SI operational metrics panel",
    ],
    plannedCapabilities: [
      "Configurable rule thresholds via admin UI",
    ],
    permittedTools: ["Field Medical analytics"],
    reviewRequirements: [
      "Findings are observational; correlation is not causation",
    ],
  },
  {
    id: "leadership-briefing",
    name: "Leadership Briefing",
    description:
      "Assembles leadership-ready summaries from dashboard and Field Medical metrics.",
    icon: iconFor("leadership-briefing"),
    category: "operations",
    status: "planned",
    route: "/agents/leadership-briefing",
    workflowHref: "/dashboard",
    responsibilities: [
      "Summarize KPI movements with denominators",
      "Separate synthetic metrics from observed activity",
    ],
    implementedCapabilities: [
      "Executive dashboard and FM analytics pages (manual briefing)",
    ],
    plannedCapabilities: [
      "Generated briefing drafts with citation of metric definitions",
    ],
    permittedTools: ["Dashboard", "FM analytics"],
    reviewRequirements: [
      "Briefings require leadership review before external sharing",
    ],
  },
  {
    id: "protocol-intelligence",
    name: "Protocol Intelligence",
    description:
      "Interprets protocol and study-design language for scientific exchange preparation.",
    icon: iconFor("protocol-intelligence"),
    category: "evidence",
    status: "planned",
    route: "/agents/protocol-intelligence",
    workflowHref: "/evidence",
    responsibilities: [
      "Extract endpoint hierarchy and analysis population cues from allowlisted docs",
      "Support MSL preparation without inventing statistics",
    ],
    implementedCapabilities: [],
    plannedCapabilities: [
      "Protocol section summarization with passage citations",
      "Linkage into simulation scenario builder",
    ],
    permittedTools: ["Evidence Library (future)"],
    reviewRequirements: [
      "Outputs provisional until medical/scientific review",
    ],
  },
];

for (const agent of MEDINTEL_AGENTS) {
  if (!MANIFEST_IDS.has(agent.id)) {
    throw new Error(`Agent ${agent.id} missing from public/agents/agents.json`);
  }
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Active",
  in_development: "In Development",
  planned: "Planned",
};

export const AGENT_CATEGORY_LABELS: Record<AgentCategory, string> = {
  evidence: "Evidence",
  medical_information: "Medical Information",
  field_medical: "Field Medical",
  safety: "Safety",
  operations: "Operations",
};

export function listAgents(): MedIntelAgent[] {
  return MEDINTEL_AGENTS;
}

export function getAgentById(id: string): MedIntelAgent | null {
  return MEDINTEL_AGENTS.find((agent) => agent.id === id) ?? null;
}
