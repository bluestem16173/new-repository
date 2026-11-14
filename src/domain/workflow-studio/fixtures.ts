import type {
  StudioRole,
  WorkflowDefinition,
  WorkflowStudioSnapshot,
} from "@/domain/workflow-studio/types";

export const DEMO_PREVIEW_LABEL =
  "Demo Preview — No Live Agent Execution";

/**
 * Role selection is a UI preference only — it does not alter authorization.
 */
export const STUDIO_ROLES: StudioRole[] = [
  {
    id: "msl",
    label: "Medical Science Liaison",
    shortLabel: "MSL",
    description:
      "Prepare for scientific exchange with key opinion leaders using evidence-grounded pathways.",
    objectivePrompt: "What do you need to prepare for your next KOL engagement?",
    defaultWorkflowId: "kol-meeting-prep",
    actions: [
      {
        id: "msl-kol-prep",
        label: "Prepare for a KOL meeting",
        description:
          "Assemble an illustrative briefing packet for a fictional cardiology KOL visit.",
        workflowId: "kol-meeting-prep",
      },
      {
        id: "msl-evidence-review",
        label: "Review exchange evidence",
        description:
          "Walk the evidence → protocol → knowledge pathway used before scientific exchange.",
        workflowId: "kol-meeting-prep",
      },
    ],
  },
  {
    id: "ma_manager",
    label: "Medical Affairs Manager",
    shortLabel: "MA Manager",
    description:
      "Design team education, coaching, and readiness pathways across Field Medical.",
    objectivePrompt: "Which team capability do you want to strengthen?",
    defaultWorkflowId: "manager-education",
    actions: [
      {
        id: "mgr-education",
        label: "Build a team education pathway",
        description:
          "Inspect a manager education flow from scenario design through coaching.",
        workflowId: "manager-education",
      },
      {
        id: "mgr-bottlenecks",
        label: "Inspect readiness bottlenecks",
        description:
          "See how operational signals feed coaching assignments in the demo pathway.",
        workflowId: "manager-education",
      },
    ],
  },
  {
    id: "mi_specialist",
    label: "Medical Information Specialist",
    shortLabel: "MI Specialist",
    description:
      "Guide an inquiry from triage through evidence-grounded drafting and review gates.",
    objectivePrompt: "What inquiry outcome are you preparing for medical review?",
    defaultWorkflowId: "mi-inquiry",
    actions: [
      {
        id: "mi-inquiry-path",
        label: "Handle an MI inquiry",
        description:
          "Navigate triage → evidence → draft → citation → safety → completeness.",
        workflowId: "mi-inquiry",
      },
      {
        id: "mi-reuse",
        label: "Reuse approved knowledge",
        description:
          "Inspect how knowledge matching feeds a provisional MI draft in demo data.",
        workflowId: "mi-inquiry",
      },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    shortLabel: "Leadership",
    description:
      "Assemble leadership-ready operational and scientific briefing summaries.",
    objectivePrompt: "What briefing do stakeholders need this week?",
    defaultWorkflowId: "leadership-briefing",
    actions: [
      {
        id: "lead-briefing",
        label: "Assemble a leadership briefing",
        description:
          "Review illustrative KPI and evidence-watch signals into a briefing packet.",
        workflowId: "leadership-briefing",
      },
      {
        id: "lead-ops",
        label: "Review operational signals",
        description:
          "Inspect bottleneck and watchlist inputs that feed the demo briefing.",
        workflowId: "leadership-briefing",
      },
    ],
  },
];

const SYNTHETIC_DISCLAIMER =
  "Illustrative Demo Data only. Fictional product (Aurelia™-X) and synthetic content — not for clinical decision-making. No live agent execution.";

export const STUDIO_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "kol-meeting-prep",
    title: "KOL Meeting Prep",
    roleId: "msl",
    objective:
      "Prepare an evidence-grounded scientific exchange briefing for a fictional cardiology KOL.",
    audience: "MSL preparing for an on-site KOL visit",
    productContext:
      "Fictional product Aurelia™-X (oral SGLT2-pathway adjunct) — synthetic teaching corpus only.",
    nodes: [
      {
        id: "kol-n1",
        agentId: "literature-scout",
        task: "Surface allowlisted publications relevant to HF hospitalization endpoints",
        status: "complete",
        inputSummary: "Topic: HFpEF hospitalization signals (demo watchlist)",
        outputSummary: "3 synthetic abstracts queued for Evidence Analyst",
        validation: "pass",
        validationNotes: "All items labeled illustrative/synthetic; no live APIs.",
        position: { x: 0, y: 80 },
        mobilePosition: { x: 40, y: 0 },
      },
      {
        id: "kol-n2",
        agentId: "evidence-analyst",
        task: "Retrieve allowlisted passages with provenance identifiers",
        status: "complete",
        inputSummary: "Synthetic document IDs from Literature Scout queue",
        outputSummary: "4 passages with demo DOI placeholders and section anchors",
        validation: "pass",
        validationNotes: "Explicit no-invention rule; passages marked untrusted until review.",
        position: { x: 280, y: 80 },
        mobilePosition: { x: 40, y: 160 },
      },
      {
        id: "kol-n3",
        agentId: "protocol-intelligence",
        task: "Extract endpoint hierarchy cues from allowlisted protocol excerpts",
        status: "complete",
        inputSummary: "Demo protocol excerpt v2.1 (synthetic)",
        outputSummary: "Primary: CV death/HHF; secondary: KCCQ — provisional notes",
        validation: "warn",
        validationNotes: "Protocol Intelligence is planned; demo shows illustrative structure only.",
        position: { x: 560, y: 80 },
        mobilePosition: { x: 40, y: 320 },
      },
      {
        id: "kol-n4",
        agentId: "knowledge-matcher",
        task: "Rank approved reusable talking points against the KOL question set",
        status: "complete",
        inputSummary: "KOL questions: renal monitoring, volume status, class effects",
        outputSummary: "2 approved knowledge matches + 1 explicit no-supported-match",
        validation: "pass",
        validationNotes: "Matches are applicability-ranked; human verification still required.",
        position: { x: 840, y: 80 },
        mobilePosition: { x: 40, y: 480 },
      },
      {
        id: "kol-n5",
        agentId: "kol-simulator",
        task: "Flag challenging follow-ups the KOL may raise in exchange",
        status: "in_review",
        inputSummary: "Scenario: cardiology KOL — scientific exchange (demo)",
        outputSummary: "3 challenge prompts tied to allowlisted passages",
        validation: "pass",
        validationNotes: "Deterministic teaching turns; no generative HCP in this preview.",
        position: { x: 1120, y: 80 },
        mobilePosition: { x: 40, y: 640 },
      },
      {
        id: "kol-n6",
        agentId: "medical-drafting",
        task: "Assemble provisional MSL briefing notes with uncertainty labels",
        status: "ready",
        inputSummary: "Passages + knowledge matches + challenge prompts",
        outputSummary: "Draft briefing outline awaiting MSL review",
        validation: "not_run",
        validationNotes: "Deliverable remains provisional; never auto-released.",
        position: { x: 1400, y: 80 },
        mobilePosition: { x: 40, y: 800 },
      },
    ],
    edges: [
      { id: "kol-e1", source: "kol-n1", target: "kol-n2", label: "sources" },
      { id: "kol-e2", source: "kol-n2", target: "kol-n3", label: "passages" },
      { id: "kol-e3", source: "kol-n3", target: "kol-n4", label: "endpoints" },
      { id: "kol-e4", source: "kol-n4", target: "kol-n5", label: "matches" },
      { id: "kol-e5", source: "kol-n5", target: "kol-n6", label: "challenges" },
    ],
    deliverable: {
      title: "KOL Meeting Prep Packet — Aurelia™-X (synthetic)",
      summary:
        "Illustrative briefing for a fictional cardiology KOL visit covering hospitalization endpoints, renal monitoring talking points, and anticipated scientific challenges.",
      sections: [
        {
          heading: "Visit context",
          body: "Dr. Mira Chen, HF clinic director (fictional). Objective: scientific exchange on HHF endpoint interpretation — not promotional dialogue.",
        },
        {
          heading: "Evidence anchors (demo)",
          body: "Four allowlisted synthetic passages with placeholder DOIs. No fabricated real-world citations.",
        },
        {
          heading: "Anticipated challenges",
          body: "Volume status differentiation, class-effect questions, and renal monitoring cadence — each linked to demo passages.",
        },
        {
          heading: "Open items",
          body: "Medical Drafting notes remain provisional pending MSL review. Protocol Intelligence outputs are illustrative only.",
        },
      ],
      disclaimer: SYNTHETIC_DISCLAIMER,
    },
  },
  {
    id: "manager-education",
    title: "Manager Education",
    roleId: "ma_manager",
    objective:
      "Design a Field Medical education pathway from scenario design through coaching and operational follow-up.",
    audience: "Medical Affairs / Field Medical manager",
    productContext:
      "Team readiness for Aurelia™-X scientific exchange (fictional product; synthetic metrics).",
    nodes: [
      {
        id: "edu-n1",
        agentId: "scenario-builder",
        task: "Select education scenario category and learning objectives",
        status: "complete",
        inputSummary: "Focus: HFpEF scientific exchange competency",
        outputSummary: "Demo scenario pack v1 selected (read-only catalog)",
        validation: "warn",
        validationNotes: "Scenario Builder is planned; catalog is seeded/read-only in demo.",
        position: { x: 0, y: 80 },
        mobilePosition: { x: 40, y: 0 },
      },
      {
        id: "edu-n2",
        agentId: "kol-simulator",
        task: "Assign interactive simulations to the cohort",
        status: "complete",
        inputSummary: "8 MSLs in Northeast team (synthetic roster)",
        outputSummary: "8 simulation sessions staged with allowlisted evidence",
        validation: "pass",
        validationNotes: "Deterministic HCP turns; provisional scores only.",
        position: { x: 280, y: 80 },
        mobilePosition: { x: 40, y: 160 },
      },
      {
        id: "edu-n3",
        agentId: "scientific-examiner",
        task: "Produce provisional competency evaluations",
        status: "in_review",
        inputSummary: "Completed simulation transcripts (demo store)",
        outputSummary: "Provisional rubrics: 2 critical flags pending validation",
        validation: "warn",
        validationNotes: "Critical flags block formal attainment until reviewer validation.",
        position: { x: 560, y: 80 },
        mobilePosition: { x: 40, y: 320 },
      },
      {
        id: "edu-n4",
        agentId: "coaching-advisor",
        task: "Create coaching plans tied to identified gaps",
        status: "ready",
        inputSummary: "Gap themes: evidence interpretation, uncertainty language",
        outputSummary: "4 coaching activities drafted for director assignment",
        validation: "not_run",
        validationNotes: "Mutations limited to admin/field_director in live app.",
        position: { x: 840, y: 80 },
        mobilePosition: { x: 40, y: 480 },
      },
      {
        id: "edu-n5",
        agentId: "bottleneck-analyst",
        task: "Surface readiness and coaching backlog signals",
        status: "ready",
        inputSummary: "FM analytics thresholds (demo reference date)",
        outputSummary: "Coaching overdue backlog flagged; sample size labeled",
        validation: "pass",
        validationNotes: "Observational findings only — correlation is not causation.",
        position: { x: 1120, y: 80 },
        mobilePosition: { x: 40, y: 640 },
      },
    ],
    edges: [
      { id: "edu-e1", source: "edu-n1", target: "edu-n2", label: "scenario" },
      { id: "edu-e2", source: "edu-n2", target: "edu-n3", label: "transcripts" },
      { id: "edu-e3", source: "edu-n3", target: "edu-n4", label: "gaps" },
      { id: "edu-e4", source: "edu-n4", target: "edu-n5", label: "plans" },
    ],
    deliverable: {
      title: "Team Education Plan — Northeast Field Medical (synthetic)",
      summary:
        "Illustrative education pathway linking scenario selection, simulation assignments, provisional evaluation, coaching, and bottleneck follow-up.",
      sections: [
        {
          heading: "Cohort",
          body: "8 synthetic MSLs. Focus competency: scientific accuracy and uncertainty communication in HFpEF exchange.",
        },
        {
          heading: "Simulation assignment",
          body: "Allowlisted KOL Simulator sessions staged for each MSL. Scores remain provisional.",
        },
        {
          heading: "Coaching follow-up",
          body: "Four drafted coaching activities targeting evidence interpretation gaps. Director assignment required in live workflows.",
        },
        {
          heading: "Operational signal",
          body: "Bottleneck Analyst flags overdue coaching backlog with denominators — observational only.",
        },
      ],
      disclaimer: SYNTHETIC_DISCLAIMER,
    },
  },
  {
    id: "mi-inquiry",
    title: "MI Inquiry",
    roleId: "mi_specialist",
    objective:
      "Guide a Medical Information inquiry from intake through evidence-grounded drafting and review gates.",
    audience: "Medical Information specialist",
    productContext:
      "HCP inquiry about Aurelia™-X renal monitoring (fictional product; synthetic case).",
    nodes: [
      {
        id: "mi-n1",
        agentId: "inquiry-triage",
        task: "Capture inquiry intake, priority, and channel",
        status: "complete",
        inputSummary: "Channel: HCP portal · Priority: standard (demo)",
        outputSummary: "Inquiry MI-2401 submitted → evidence_review",
        validation: "pass",
        validationNotes: "RBAC-guarded transitions apply in live inquiry workspace.",
        position: { x: 0, y: 40 },
        mobilePosition: { x: 40, y: 0 },
      },
      {
        id: "mi-n2",
        agentId: "evidence-analyst",
        task: "Retrieve allowlisted passages for the scientific question",
        status: "complete",
        inputSummary: "Question: eGFR monitoring cadence with Aurelia™-X",
        outputSummary: "2 passages + 1 explicit no-evidence note for off-label ask",
        validation: "pass",
        validationNotes: "No-evidence handling is explicit; content untrusted until review.",
        position: { x: 280, y: 40 },
        mobilePosition: { x: 40, y: 160 },
      },
      {
        id: "mi-n3",
        agentId: "knowledge-matcher",
        task: "Search approved reusable knowledge for applicability",
        status: "complete",
        inputSummary: "Approved knowledge corpus (demo)",
        outputSummary: "1 strong match; applicability warning on population",
        validation: "warn",
        validationNotes: "Similarity ≠ approved applicability — human verify before use.",
        position: { x: 560, y: 40 },
        mobilePosition: { x: 40, y: 320 },
      },
      {
        id: "mi-n4",
        agentId: "medical-drafting",
        task: "Draft provisional MI response with limitations",
        status: "in_review",
        inputSummary: "Passages + knowledge match + inquiry metadata",
        outputSummary: "Provisional draft v1 with uncertainty and missing-evidence notes",
        validation: "pass",
        validationNotes: "Never auto-approve or externally release.",
        position: { x: 840, y: 40 },
        mobilePosition: { x: 40, y: 480 },
      },
      {
        id: "mi-n5",
        agentId: "citation-auditor",
        task: "Map claims to citations; flag unsupported quantities",
        status: "ready",
        inputSummary: "Draft claims from Medical Drafting v1",
        outputSummary: "3 claims pending · 0 unsupported quantitative claims",
        validation: "not_run",
        validationNotes: "Only medical_reviewer or admin may change claim statuses live.",
        position: { x: 1120, y: 40 },
        mobilePosition: { x: 40, y: 640 },
      },
      {
        id: "mi-n6",
        agentId: "pharmacovigilance",
        task: "Scan for safety-event language requiring human assessment",
        status: "ready",
        inputSummary: "Inquiry text + draft body",
        outputSummary: "No safety-event language detected (demo heuristic)",
        validation: "pass",
        validationNotes: "Flags require human assessment; no autonomous reporting.",
        position: { x: 1400, y: 40 },
        mobilePosition: { x: 40, y: 800 },
      },
      {
        id: "mi-n7",
        agentId: "case-completeness",
        task: "Check missing fields, evidence, and review steps",
        status: "pending",
        inputSummary: "Case packet MI-2401",
        outputSummary: "Awaiting citation auditor completion before checklist",
        validation: "not_run",
        validationNotes: "Case Completeness is planned; checklist is illustrative.",
        position: { x: 1680, y: 40 },
        mobilePosition: { x: 40, y: 960 },
      },
    ],
    edges: [
      { id: "mi-e1", source: "mi-n1", target: "mi-n2", label: "question" },
      { id: "mi-e2", source: "mi-n2", target: "mi-n3", label: "passages" },
      { id: "mi-e3", source: "mi-n3", target: "mi-n4", label: "matches" },
      { id: "mi-e4", source: "mi-n4", target: "mi-n5", label: "draft" },
      { id: "mi-e5", source: "mi-n5", target: "mi-n6", label: "claims" },
      { id: "mi-e6", source: "mi-n6", target: "mi-n7", label: "safety" },
    ],
    deliverable: {
      title: "Provisional MI Response — Case MI-2401 (synthetic)",
      summary:
        "Illustrative Medical Information draft on renal monitoring for Aurelia™-X, grounded in demo passages and approved knowledge matches — awaiting medical review.",
      sections: [
        {
          heading: "Inquiry",
          body: "HCP asks about eGFR monitoring cadence when initiating Aurelia™-X (fictional). Off-label dosing question returns explicit no-evidence.",
        },
        {
          heading: "Draft posture",
          body: "Provisional language with limitations, uncertainty notes, and citation placeholders. Not approved for external release.",
        },
        {
          heading: "Review gates",
          body: "Citation Auditor claim mapping pending. Pharmacovigilance demo scan clear. Completeness checklist awaiting auditor step.",
        },
      ],
      disclaimer: SYNTHETIC_DISCLAIMER,
    },
  },
  {
    id: "leadership-briefing",
    title: "Leadership Briefing",
    roleId: "leadership",
    objective:
      "Assemble a leadership-ready summary from operational bottlenecks and evidence-watch signals.",
    audience: "Medical Affairs leadership",
    productContext:
      "Weekly Medical Affairs briefing — Aurelia™-X program (fictional; synthetic KPIs).",
    nodes: [
      {
        id: "lead-n1",
        agentId: "bottleneck-analyst",
        task: "Summarize Field Medical readiness and coaching bottlenecks",
        status: "complete",
        inputSummary: "FM analytics KPIs with denominators (demo)",
        outputSummary: "2 bottleneck findings · sample sizes labeled unstable where needed",
        validation: "pass",
        validationNotes: "Observational only; no causal productivity claims.",
        position: { x: 0, y: 80 },
        mobilePosition: { x: 40, y: 0 },
      },
      {
        id: "lead-n2",
        agentId: "evidence-watch",
        task: "Surface emerging evidence signals for human assessment",
        status: "complete",
        inputSummary: "Watch topics: HHF endpoints, renal safety signals (demo)",
        outputSummary: "1 illustrative change digest — informational only",
        validation: "warn",
        validationNotes: "Evidence Watch is planned; digest is fixture content only.",
        position: { x: 280, y: 80 },
        mobilePosition: { x: 40, y: 160 },
      },
      {
        id: "lead-n3",
        agentId: "inquiry-triage",
        task: "Pull MI queue aging and priority mix for the period",
        status: "complete",
        inputSummary: "MI inquiry workspace metrics (demo)",
        outputSummary: "Queue mix: 12 open · 3 medical_review · 1 needs_revision",
        validation: "pass",
        validationNotes: "Synthetic queue counts for briefing narrative only.",
        position: { x: 560, y: 80 },
        mobilePosition: { x: 40, y: 320 },
      },
      {
        id: "lead-n4",
        agentId: "leadership-briefing",
        task: "Compose leadership summary with metric definitions cited",
        status: "ready",
        inputSummary: "Bottlenecks + watch digest + MI queue mix",
        outputSummary: "Briefing draft sections assembled for leadership review",
        validation: "not_run",
        validationNotes: "Leadership Briefing agent is planned; assembly is illustrative.",
        position: { x: 840, y: 80 },
        mobilePosition: { x: 40, y: 480 },
      },
    ],
    edges: [
      { id: "lead-e1", source: "lead-n1", target: "lead-n4", label: "ops" },
      { id: "lead-e2", source: "lead-n2", target: "lead-n4", label: "signals" },
      { id: "lead-e3", source: "lead-n3", target: "lead-n4", label: "queue" },
    ],
    deliverable: {
      title: "Leadership Briefing — Week of Demo Reference (synthetic)",
      summary:
        "Illustrative leadership packet combining Field Medical bottleneck signals, an evidence-watch digest, and MI queue aging — for internal demo review only.",
      sections: [
        {
          heading: "Operational highlights",
          body: "Coaching overdue backlog flagged with denominators. Readiness sample labeled where unstable. No causal claims.",
        },
        {
          heading: "Evidence watch",
          body: "One synthetic change digest on HHF endpoint language — informational until human assessment.",
        },
        {
          heading: "MI operations",
          body: "12 open inquiries; 3 in medical review; 1 needs revision. Synthetic counts only.",
        },
        {
          heading: "Ask of leadership",
          body: "Confirm coaching capacity for Northeast cohort; defer external sharing until briefing review.",
        },
      ],
      disclaimer: SYNTHETIC_DISCLAIMER,
    },
  },
];

export const WORKFLOW_STUDIO_SNAPSHOT: WorkflowStudioSnapshot = {
  roles: STUDIO_ROLES,
  workflows: STUDIO_WORKFLOWS,
  demoLabel: DEMO_PREVIEW_LABEL,
};
