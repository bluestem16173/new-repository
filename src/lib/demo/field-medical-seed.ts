import type {
  Assessment,
  CoachingActivity,
  CoachingPlan,
  CompetencyRequirement,
  FieldDirector,
  FmAuditEvent,
  FmCompetency,
  MslProfile,
  ReadinessDecision,
  Simulation,
  SimulationAttempt,
  TherapeuticArea,
} from "@/domain/field-medical/types";
import { THERAPEUTIC_AREAS } from "@/domain/field-medical/types";
import { FM_DEMO_REFERENCE_AS_OF } from "@/domain/field-medical/metrics";

export const FM_DEMO_SEED = 20260315;
export const FM_DEMO_NOTICE =
  "Field Medical data is synthetic demonstration content only. Not affiliated with any pharmaceutical company. Not for clinical or operational decision-making.";

const FIRST_NAMES = [
  "Avery", "Blake", "Cameron", "Dana", "Eden", "Finley", "Gray", "Harper",
  "Indigo", "Jordan", "Kai", "Logan", "Morgan", "Noa", "Oakley", "Parker",
  "Quinn", "Reese", "Sawyer", "Tatum", "Val", "Winter", "Alex", "Casey",
  "Drew", "Emery", "Frankie", "Hayden", "Jamie", "Kendall", "Lane", "Micah",
];

const LAST_NAMES = [
  "Nguyen", "Patel", "Brooks", "Silva", "Okoye", "Cohen", "Martinez", "Singh",
  "Andersen", "Kim", "Hassan", "Okafor", "Berg", "Duarte", "Ibrahim", "Chen",
  "Walsh", "Rossi", "Nakamura", "Ali", "Foster", "Garcia", "Hughes", "Iyer",
];

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Central", "Mountain"];

export interface FieldMedicalStore {
  directors: FieldDirector[];
  msls: MslProfile[];
  competencies: FmCompetency[];
  requirements: CompetencyRequirement[];
  assessments: Assessment[];
  readinessDecisions: ReadinessDecision[];
  coachingPlans: CoachingPlan[];
  coachingActivities: CoachingActivity[];
  simulations: Simulation[];
  simulationAttempts: SimulationAttempt[];
  auditEvents: FmAuditEvent[];
  reportingAsOf: string;
}

declare global {
  var __medintelFieldMedicalStore: FieldMedicalStore | undefined;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFromSeed(rng: () => number, namespace: string, index: number): string {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const bytes: number[] = [];
  // Mix namespace + index into RNG draws for stability
  let mix = 0;
  for (let i = 0; i < namespace.length; i += 1) mix = (mix + namespace.charCodeAt(i) * (i + 1)) % 9973;
  mix = (mix + index * 131) % 9973;
  for (let i = 0; i < mix % 5; i += 1) rng();
  for (let i = 0; i < 16; i += 1) bytes.push(Math.floor(rng() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const b = bytes.map(hex).join("");
  return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}`;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

function addDaysIso(isoDate: string, days: number): string {
  const normalized =
    isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00.000Z`;
  const ms = Date.parse(normalized) + days * 86400000;
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid date input for addDaysIso: ${isoDate}`);
  }
  return new Date(ms).toISOString();
}

function dateOnlyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

export function createFieldMedicalSeed(seed = FM_DEMO_SEED): FieldMedicalStore {
  const rng = mulberry32(seed);
  const asOf = FM_DEMO_REFERENCE_AS_OF;
  const now = asOf;

  const directors: FieldDirector[] = Array.from({ length: 8 }, (_, i) => {
    const ta = THERAPEUTIC_AREAS[i % THERAPEUTIC_AREAS.length];
    const fullName = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    return {
      id: uuidFromSeed(rng, "director", i),
      profileId: null,
      employeeCode: `FD-${String(i + 1).padStart(3, "0")}`,
      fullName,
      email: `fd${i + 1}@demo.medintel.local`,
      primaryTherapeuticArea: ta,
      createdAt: "2025-01-01T12:00:00.000Z",
      updatedAt: "2025-01-01T12:00:00.000Z",
    };
  });

  const competencyDefs = [
    { code: "SCI-EXCH", name: "Scientific Exchange Quality", domain: "Scientific" },
    { code: "EVID-INT", name: "Evidence Interpretation", domain: "Scientific" },
    { code: "SAF-DISC", name: "Safety Discussion Discipline", domain: "Safety" },
    { code: "KOL-ENG", name: "KOL Engagement Planning", domain: "Engagement" },
    { code: "COMP-ETH", name: "Compliance & Ethics Judgment", domain: "Compliance" },
    { code: "INSIGHT", name: "Insight Capture & Synthesis", domain: "Insights" },
    { code: "TA-DEPTH", name: "Therapeutic Area Depth", domain: "Scientific" },
    { code: "PEER-EDU", name: "Peer Education Delivery", domain: "Education" },
  ];

  const competencies: FmCompetency[] = competencyDefs.map((def, i) => ({
    id: uuidFromSeed(rng, "competency", i),
    code: def.code,
    name: def.name,
    description: `Synthetic competency for ${def.name}. Illustrative rubric only.`,
    domain: def.domain,
    createdAt: "2025-01-01T12:00:00.000Z",
    updatedAt: "2025-01-01T12:00:00.000Z",
  }));

  const requirements: CompetencyRequirement[] = [];
  let reqIndex = 0;
  for (const ta of THERAPEUTIC_AREAS) {
    for (const competency of competencies) {
      // v1 requirements
      requirements.push({
        id: uuidFromSeed(rng, "requirement", reqIndex),
        competencyId: competency.id,
        therapeuticArea: ta,
        rubricVersion: "2025.1",
        passingScore: 80,
        effectiveFrom: "2025-01-01",
        effectiveTo: "2025-09-30",
        isRequired: true,
        createdAt: "2025-01-01T12:00:00.000Z",
      });
      reqIndex += 1;
      // v2 superseding requirements (rubric change handled explicitly)
      requirements.push({
        id: uuidFromSeed(rng, "requirement", reqIndex),
        competencyId: competency.id,
        therapeuticArea: ta,
        rubricVersion: "2025.2",
        passingScore: 82,
        effectiveFrom: "2025-10-01",
        effectiveTo: null,
        isRequired: competency.code !== "PEER-EDU" || ta !== "general_medicine",
        createdAt: "2025-09-15T12:00:00.000Z",
      });
      reqIndex += 1;
    }
  }

  const msls: MslProfile[] = Array.from({ length: 64 }, (_, i) => {
    const ta = THERAPEUTIC_AREAS[i % THERAPEUTIC_AREAS.length];
    const directorPool = directors.filter((d) => d.primaryTherapeuticArea === ta);
    const director = directorPool[i % directorPool.length] ?? directors[i % directors.length];
    const onboardingOffset = -Math.floor(rng() * 360) - 10;
    const start = dateOnlyFromIso(addDaysIso("2026-03-15", onboardingOffset));
    const fullName = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    return {
      id: uuidFromSeed(rng, "msl", i),
      profileId: null,
      employeeCode: `MSL-${String(i + 1).padStart(3, "0")}`,
      fullName,
      email: `msl${i + 1}@demo.medintel.local`,
      therapeuticArea: ta,
      fieldDirectorId: director.id,
      onboardingStartDate: start,
      region: pick(rng, REGIONS),
      isActive: true,
      createdAt: `${start}T12:00:00.000Z`,
      updatedAt: `${start}T12:00:00.000Z`,
    };
  });

  const assessments: Assessment[] = [];
  let assessmentIndex = 0;
  for (const msl of msls) {
    const applicable = requirements.filter(
      (r) =>
        r.therapeuticArea === msl.therapeuticArea &&
        r.isRequired &&
        r.effectiveFrom <= "2026-03-15" &&
        (!r.effectiveTo || r.effectiveTo >= "2025-01-01"),
    );

    for (const req of applicable) {
      const attempts = 1 + Math.floor(rng() * 3);
      for (let a = 0; a < attempts; a += 1) {
        const daysAfterStart = 20 + Math.floor(rng() * 200) + a * 25;
        const assessedAt = addDaysIso(msl.onboardingStartDate, daysAfterStart);
        if (Date.parse(assessedAt) > Date.parse(asOf)) continue;

        const roll = rng();
        let validationStatus: Assessment["validationStatus"] = "validated";
        let passed = true;
        let score = 82 + Math.floor(rng() * 16);

        if (roll < 0.12) {
          passed = false;
          score = 55 + Math.floor(rng() * 24);
          validationStatus = "validated";
        } else if (roll < 0.2) {
          validationStatus = "pending_review";
          passed = score >= req.passingScore;
        } else if (roll < 0.26) {
          validationStatus = "expired";
          passed = true;
        } else if (a < attempts - 1) {
          validationStatus = "superseded";
          passed = score >= req.passingScore;
        }

        const validUntil =
          validationStatus === "validated" && passed
            ? addDaysIso(assessedAt, 365)
            : validationStatus === "expired"
              ? addDaysIso(assessedAt, 90)
              : null;

        assessments.push({
          id: uuidFromSeed(rng, "assessment", assessmentIndex),
          mslId: msl.id,
          competencyId: req.competencyId,
          requirementId: req.id,
          rubricVersion: req.rubricVersion,
          score,
          passed,
          validationStatus,
          assessedAt,
          validUntil:
            validUntil && validationStatus === "expired"
              ? addDaysIso(asOf, -10)
              : validUntil,
          reviewerId: msl.fieldDirectorId,
          evidenceReference: `SYN-EVID-${assessmentIndex + 1}`,
          notes: "Synthetic assessment record",
          createdAt: assessedAt,
          updatedAt: assessedAt,
        });
        assessmentIndex += 1;
      }
    }
  }

  // Ensure >= 500 assessments
  while (assessments.length < 500) {
    const msl = pick(rng, msls);
    const competency = pick(rng, competencies);
    const assessedAt = addDaysIso("2025-04-01", Math.floor(rng() * 300));
    assessments.push({
      id: uuidFromSeed(rng, "assessment-pad", assessments.length),
      mslId: msl.id,
      competencyId: competency.id,
      requirementId: null,
      rubricVersion: "2025.2",
      score: 70 + Math.floor(rng() * 30),
      passed: rng() > 0.25,
      validationStatus: pick(rng, [
        "validated",
        "validated",
        "pending_review",
        "superseded",
      ]),
      assessedAt,
      validUntil: addDaysIso(assessedAt, 365),
      reviewerId: msl.fieldDirectorId,
      evidenceReference: null,
      notes: "Padding synthetic assessment",
      createdAt: assessedAt,
      updatedAt: assessedAt,
    });
  }

  const readinessDecisions: ReadinessDecision[] = [];
  let readinessIndex = 0;
  for (const [i, msl] of msls.entries()) {
    const roll = rng();
    if (roll < 0.55) {
      const days = 60 + Math.floor(rng() * 90);
      const decidedAt = addDaysIso(msl.onboardingStartDate, days);
      if (Date.parse(decidedAt) <= Date.parse(asOf)) {
        readinessDecisions.push({
          id: uuidFromSeed(rng, "readiness", readinessIndex),
          mslId: msl.id,
          outcome: "approved",
          decidedByDirectorId: msl.fieldDirectorId,
          decidedAt,
          rationale: "Synthetic readiness approval after required competencies.",
          evidenceSummary: "Validated assessments reviewed (synthetic).",
          isActive: true,
          createdAt: decidedAt,
        });
        readinessIndex += 1;
        // Occasional duplicate inactive approval attempt (should not double-count)
        if (i % 11 === 0) {
          readinessDecisions.push({
            id: uuidFromSeed(rng, "readiness-dup", readinessIndex),
            mslId: msl.id,
            outcome: "approved",
            decidedByDirectorId: msl.fieldDirectorId,
            decidedAt: addDaysIso(decidedAt, 2),
            rationale: "Duplicate synthetic approval marked inactive.",
            evidenceSummary: null,
            isActive: false,
            createdAt: addDaysIso(decidedAt, 2),
          });
          readinessIndex += 1;
        }
      }
    } else if (roll < 0.65) {
      const decidedAt = addDaysIso(msl.onboardingStartDate, 45 + Math.floor(rng() * 40));
      readinessDecisions.push({
        id: uuidFromSeed(rng, "readiness", readinessIndex),
        mslId: msl.id,
        outcome: pick(rng, ["deferred", "denied"]),
        decidedByDirectorId: msl.fieldDirectorId,
        decidedAt,
        rationale: "Synthetic deferred/denied readiness decision.",
        evidenceSummary: null,
        isActive: true,
        createdAt: decidedAt,
      });
      readinessIndex += 1;
    }
  }

  const coachingPlans: CoachingPlan[] = [];
  const coachingActivities: CoachingActivity[] = [];
  let planIndex = 0;
  let activityIndex = 0;

  for (const msl of msls) {
    if (rng() > 0.7) continue;
    const focus = pick(rng, competencies);
    const createdAt = addDaysIso(msl.onboardingStartDate, 30 + Math.floor(rng() * 80));
    const planId = uuidFromSeed(rng, "plan", planIndex);
    const status = pick(rng, [
      "active",
      "active",
      "completed",
      "draft",
    ] as const);
    coachingPlans.push({
      id: planId,
      mslId: msl.id,
      directorId: msl.fieldDirectorId,
      title: `Capability plan · ${focus.code}`,
      focusCompetencyId: focus.id,
      status,
      objective: `Address synthetic gap in ${focus.name} for demonstration.`,
      createdAt,
      updatedAt: createdAt,
    });
    planIndex += 1;

    const activityCount = 2 + Math.floor(rng() * 3);
    for (let a = 0; a < activityCount; a += 1) {
      const dueAt = addDaysIso(createdAt, 14 + a * 21 + Math.floor(rng() * 10));
      const roll = rng();
      let activityStatus: CoachingActivity["status"] = "planned";
      let completedAt: string | null = null;
      if (roll < 0.45 && Date.parse(dueAt) <= Date.parse(asOf)) {
        activityStatus = "completed";
        // Mix on-time and late
        completedAt =
          rng() < 0.65
            ? addDaysIso(dueAt, -Math.floor(rng() * 5))
            : addDaysIso(dueAt, 1 + Math.floor(rng() * 12));
      } else if (Date.parse(dueAt) < Date.parse(asOf) && roll < 0.75) {
        activityStatus = "in_progress";
      }

      coachingActivities.push({
        id: uuidFromSeed(rng, "activity", activityIndex),
        planId,
        title: `Coaching activity ${a + 1}`,
        description: "Synthetic coaching activity with due date and outcome tracking.",
        dueAt,
        completedAt,
        status: activityStatus,
        outcomeNotes:
          activityStatus === "completed"
            ? "Synthetic outcome notes recorded after session."
            : null,
        reassessmentScheduledAt:
          activityStatus === "completed" && rng() < 0.4
            ? addDaysIso(completedAt ?? dueAt, 30)
            : null,
        createdAt,
        updatedAt: completedAt ?? createdAt,
      });
      activityIndex += 1;
    }
  }

  while (coachingActivities.length < 120) {
    const plan = pick(rng, coachingPlans);
    const dueAt = addDaysIso("2025-06-01", Math.floor(rng() * 250));
    coachingActivities.push({
      id: uuidFromSeed(rng, "activity-pad", coachingActivities.length),
      planId: plan.id,
      title: "Additional synthetic coaching activity",
      description: null,
      dueAt,
      completedAt: rng() < 0.5 ? addDaysIso(dueAt, -1) : null,
      status: rng() < 0.5 ? "completed" : "planned",
      outcomeNotes: null,
      reassessmentScheduledAt: null,
      createdAt: dueAt,
      updatedAt: dueAt,
    });
  }

  const simulations: Simulation[] = competencies.slice(0, 6).map((c, i) => ({
    id: uuidFromSeed(rng, "simulation", i),
    competencyId: c.id,
    title: `${c.name} simulation`,
    scenarioSummary: "Synthetic scientific exchange scenario for demonstration.",
    difficulty: pick(rng, ["beginner", "intermediate", "advanced"] as const),
    createdAt: "2025-02-01T12:00:00.000Z",
  }));

  const simulationAttempts: SimulationAttempt[] = [];
  let simAttempt = 0;
  for (const msl of msls) {
    if (rng() > 0.55) continue;
    const simulation = pick(rng, simulations);
    const attemptedAt = addDaysIso(msl.onboardingStartDate, 40 + Math.floor(rng() * 120));
    if (Date.parse(attemptedAt) > Date.parse(asOf)) continue;
    const score = 60 + Math.floor(rng() * 40);
    simulationAttempts.push({
      id: uuidFromSeed(rng, "sim-attempt", simAttempt),
      simulationId: simulation.id,
      mslId: msl.id,
      attemptedAt,
      score,
      passed: score >= 75,
      facilitatorNotes: "Synthetic simulation attempt",
      createdAt: attemptedAt,
    });
    simAttempt += 1;
  }

  const auditEvents: FmAuditEvent[] = [];
  let auditIndex = 0;
  for (const decision of readinessDecisions.filter((d) => d.isActive)) {
    auditEvents.push({
      id: uuidFromSeed(rng, "fm-audit", auditIndex),
      entityType: "fm_readiness_decision",
      entityId: decision.id,
      action: `readiness_${decision.outcome}`,
      actorRole: "field_director",
      actorName: directors.find((d) => d.id === decision.decidedByDirectorId)?.fullName ?? null,
      metadata: { mslId: decision.mslId, synthetic: true },
      createdAt: decision.decidedAt,
    });
    auditIndex += 1;
  }
  for (const activity of coachingActivities.filter((a) => a.status === "completed")) {
    auditEvents.push({
      id: uuidFromSeed(rng, "fm-audit", auditIndex),
      entityType: "fm_coaching_activity",
      entityId: activity.id,
      action: "coaching_activity_completed",
      actorRole: "field_director",
      actorName: null,
      metadata: { planId: activity.planId, synthetic: true },
      createdAt: activity.completedAt ?? activity.updatedAt,
    });
    auditIndex += 1;
  }

  return {
    directors,
    msls,
    competencies,
    requirements,
    assessments,
    readinessDecisions,
    coachingPlans,
    coachingActivities,
    simulations,
    simulationAttempts,
    auditEvents,
    reportingAsOf: now,
  };
}

export function getFieldMedicalStore(): FieldMedicalStore {
  if (!globalThis.__medintelFieldMedicalStore) {
    globalThis.__medintelFieldMedicalStore = createFieldMedicalSeed();
  }
  return globalThis.__medintelFieldMedicalStore;
}

export function resetFieldMedicalStore(): FieldMedicalStore {
  globalThis.__medintelFieldMedicalStore = createFieldMedicalSeed();
  return globalThis.__medintelFieldMedicalStore;
}

export function assertDemoOnlyReset(runtimeMode: "demo" | "supabase"): void {
  if (runtimeMode !== "demo") {
    throw new Error(
      "Field Medical seed reset is restricted to development/demo mode.",
    );
  }
}

export function therapeuticAreaLabel(ta: TherapeuticArea): string {
  switch (ta) {
    case "oncology":
      return "Oncology";
    case "inflammation":
      return "Inflammation";
    case "rare_disease":
      return "Rare Disease";
    case "general_medicine":
      return "General Medicine";
  }
}
