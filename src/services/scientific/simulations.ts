import { randomUUID } from "crypto";
import { provisionalEvaluationSchema } from "@/domain/scientific/schemas";
import type {
  ProvisionalEvaluation,
  SimulationScenario,
  SimulationSession,
} from "@/domain/scientific/types";
import type { TherapeuticArea } from "@/domain/field-medical/types";
import { getScientificStore } from "@/lib/demo/scientific-evidence-seed";
import { retrieveEvidence } from "@/services/scientific/retrieval";

export async function listSimulationScenarios(
  therapeuticArea?: TherapeuticArea,
): Promise<SimulationScenario[]> {
  const scenarios = getScientificStore().scenarios;
  if (!therapeuticArea) return [...scenarios];
  return scenarios.filter((s) => s.therapeuticArea === therapeuticArea);
}

export async function getSimulationScenario(id: string) {
  return getScientificStore().scenarios.find((s) => s.id === id) ?? null;
}

export async function getSimulationSession(id: string) {
  return getScientificStore().sessions.find((s) => s.id === id) ?? null;
}

export async function startSimulationSession(scenarioId: string): Promise<SimulationSession> {
  const store = getScientificStore();
  const scenario = store.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error("Scenario not found");

  const now = new Date().toISOString();
  const session: SimulationSession = {
    id: randomUUID(),
    scenarioId,
    mslId: null,
    status: "in_progress",
    scenarioVersion: scenario.scenarioVersion,
    startedAt: now,
    completedAt: null,
    turns: [
      {
        id: randomUUID(),
        sessionId: "pending",
        turnIndex: 0,
        speaker: "hcp",
        content: `${scenario.hcpPersona}\n\n${scenario.clinicalContext}\n\nPlease walk me through your scientific response. Do not invent study facts beyond the allowlisted teaching materials.`,
        citedPassageIds: [],
        createdAt: now,
      },
    ],
  };
  session.turns[0].sessionId = session.id;
  store.sessions.unshift(session);
  return session;
}

/**
 * Deterministic HCP follow-up that never invents study statistics.
 * Uses only allowlisted retrieval hits or an explicit no-evidence prompt.
 */
export async function submitMslTurn(params: {
  sessionId: string;
  mslMessage: string;
}): Promise<SimulationSession> {
  const store = getScientificStore();
  const session = store.sessions.find((s) => s.id === params.sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "in_progress") {
    throw new Error("Session is not in progress");
  }

  const scenario = store.scenarios.find((s) => s.id === session.scenarioId);
  if (!scenario) throw new Error("Scenario missing");

  const now = new Date().toISOString();
  const mslTurnIndex = session.turns.length;
  session.turns.push({
    id: randomUUID(),
    sessionId: session.id,
    turnIndex: mslTurnIndex,
    speaker: "msl",
    content: params.mslMessage,
    citedPassageIds: [],
    createdAt: now,
  });

  const retrieval = retrieveEvidence({
    query: params.mslMessage,
    allowedDocumentIds: scenario.allowedEvidenceDocumentIds,
    limit: 2,
  });

  let hcpContent: string;
  const cited: string[] = [];
  if (retrieval.noEvidence) {
    hcpContent =
      "As a fictional HCP in this teaching simulation: I am not seeing a cited source passage for that claim. Can you either point to an allowlisted teaching note or explicitly state that evidence is insufficient? Please do not invent trial statistics.";
  } else {
    const hit = retrieval.hits[0];
    cited.push(hit.passage.id);
    hcpContent = `As a fictional HCP in this teaching simulation: thank you. I see you are referencing teaching material “${hit.document.title}” (${hit.passage.passageKey}). Challenging follow-up — without inventing numbers: what uncertainty or limitation should I keep in mind before applying this to practice?`;
  }

  session.turns.push({
    id: randomUUID(),
    sessionId: session.id,
    turnIndex: mslTurnIndex + 1,
    speaker: "hcp",
    content: hcpContent,
    citedPassageIds: cited,
    createdAt: new Date().toISOString(),
  });

  return session;
}

export function evaluateSessionProvisionally(
  session: SimulationSession,
): ProvisionalEvaluation {
  const scenario = getScientificStore().scenarios.find(
    (s) => s.id === session.scenarioId,
  );
  const mslTurns = session.turns.filter((t) => t.speaker === "msl");
  const joined = mslTurns.map((t) => t.content.toLowerCase()).join(" ");

  const flags: string[] = [];
  const inventPatterns = [
    /p\s*<\s*0\.\d+/i,
    /hazard ratio of \d/i,
    /\d+%\s+reduction/i,
    /n\s*=\s*\d{3,}/i,
  ];
  for (const pattern of inventPatterns) {
    if (pattern.test(joined)) {
      flags.push(
        "Potential invented quantitative claim detected without allowlisted statistic",
      );
      break;
    }
  }

  const mentionsUncertainty =
    /uncertain|insufficient|do not know|cannot confirm|labeled|escalate/.test(
      joined,
    );
  const mentionsCompliance =
    /off-label|unapproved|medical information|compliance|not promotional/.test(
      joined,
    );

  const retrieval = retrieveEvidence({
    query: joined,
    allowedDocumentIds: scenario?.allowedEvidenceDocumentIds,
    limit: 3,
  });

  const draft = {
    scientificAccuracy: flags.length ? 45 : retrieval.noEvidence ? 62 : 82,
    evidenceInterpretation: retrieval.noEvidence ? 55 : 80,
    compliance: mentionsCompliance || scenario?.category === "off_label_inquiry" ? 85 : 70,
    communication: Math.min(90, 60 + mslTurns.length * 5),
    uncertaintyHandling: mentionsUncertainty ? 88 : 58,
    criticalInaccuracyFlags: flags,
    notes:
      "Provisional rubric scores from deterministic teaching heuristics. Not a formal competency record until a qualified reviewer validates. Does not auto-approve readiness.",
  };

  return provisionalEvaluationSchema.parse(draft);
}

export async function completeSimulationSession(sessionId: string) {
  const store = getScientificStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "completed") {
    const existing = store.evaluations.find((e) => e.sessionId === sessionId);
    if (existing) {
      return { session, evaluation: existing.evaluation, evaluationId: existing.id };
    }
  }
  session.status = "completed";
  session.completedAt = new Date().toISOString();
  const scenario = store.scenarios.find((s) => s.id === session.scenarioId);
  const evaluation = evaluateSessionProvisionally(session);
  const evaluationId = randomUUID();
  store.evaluations.unshift({
    id: evaluationId,
    sessionId: session.id,
    rubricVersion: scenario?.rubricVersion ?? "unknown",
    provisional: true,
    reviewerValidated: false,
    reviewerName: null,
    validatedAt: null,
    evaluation,
    createdAt: new Date().toISOString(),
  });
  return { session, evaluation, evaluationId };
}

/**
 * Qualified reviewer validation only. Never auto-approves readiness or formal competency.
 */
export async function validateSimulationEvaluation(params: {
  evaluationId: string;
  approve: boolean;
  reviewerName: string;
}) {
  const store = getScientificStore();
  const record = store.evaluations.find((e) => e.id === params.evaluationId);
  if (!record) throw new Error("Evaluation not found");
  if (!params.approve) {
    record.reviewerValidated = false;
    record.reviewerName = params.reviewerName;
    record.validatedAt = new Date().toISOString();
    return record;
  }
  if (record.evaluation.criticalInaccuracyFlags.length > 0) {
    throw new Error(
      "Cannot validate formal competency while critical inaccuracy flags remain. Address flags first.",
    );
  }
  record.reviewerValidated = true;
  record.reviewerName = params.reviewerName;
  record.validatedAt = new Date().toISOString();
  return record;
}
