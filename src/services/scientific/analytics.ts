import type { TherapeuticArea } from "@/domain/field-medical/types";
import { SIMULATION_CATEGORY_LABELS } from "@/domain/scientific/types";
import { getScientificStore } from "@/lib/demo/scientific-evidence-seed";

/**
 * Operational analytics for Scientific Intelligence demo activity.
 * Metrics are observed from in-memory demo store activity unless noted as synthetic seed baselines.
 * Denominators and missing-data behavior are explicit. No causal productivity claims.
 */
export function getScientificIntelligenceAnalytics(options?: {
  therapeuticArea?: TherapeuticArea | "all";
}) {
  const store = getScientificStore();
  const ta = options?.therapeuticArea ?? "all";
  const scenarios =
    ta === "all"
      ? store.scenarios
      : store.scenarios.filter((s) => s.therapeuticArea === ta);
  const scenarioIds = new Set(scenarios.map((s) => s.id));
  const sessions = store.sessions.filter((s) => scenarioIds.has(s.scenarioId));
  const completed = sessions.filter((s) => s.status === "completed");
  const evaluations = store.evaluations.filter((e) =>
    completed.some((s) => s.id === e.sessionId),
  );
  const validated = evaluations.filter((e) => e.reviewerValidated);

  const completionRate =
    sessions.length === 0
      ? null
      : Math.round((completed.length / sessions.length) * 1000) / 10;
  const validationRate =
    evaluations.length === 0
      ? null
      : Math.round((validated.length / evaluations.length) * 1000) / 10;

  const gapsByCategory = (
    Object.keys(SIMULATION_CATEGORY_LABELS) as Array<
      keyof typeof SIMULATION_CATEGORY_LABELS
    >
  ).map((category) => {
    const categoryScenarios = scenarios.filter((s) => s.category === category);
    const categorySessions = sessions.filter((s) =>
      categoryScenarios.some((sc) => sc.id === s.scenarioId),
    );
    const categoryEvals = evaluations.filter((e) =>
      categorySessions.some((s) => s.id === e.sessionId),
    );
    const flagged = categoryEvals.filter(
      (e) => e.evaluation.criticalInaccuracyFlags.length > 0,
    );
    const avgAccuracy =
      categoryEvals.length === 0
        ? null
        : Math.round(
            (categoryEvals.reduce(
              (sum, e) => sum + e.evaluation.scientificAccuracy,
              0,
            ) /
              categoryEvals.length) *
              10,
          ) / 10;
    return {
      category,
      label: SIMULATION_CATEGORY_LABELS[category],
      scenarioCount: categoryScenarios.length,
      sessionCount: categorySessions.length,
      evaluationCount: categoryEvals.length,
      criticalFlagCount: flagged.length,
      avgScientificAccuracy: avgAccuracy,
      definition:
        "Avg scientific accuracy over provisional evaluations in category; null when no evaluations. Critical flags counted independently of scores.",
    };
  });

  const drafts = store.drafts;
  const claims = drafts.flatMap((d) => d.claims);
  const unsupported = claims.filter((c) => c.status === "unsupported");
  const supported = claims.filter((c) => c.status === "supported");
  const pending = claims.filter((c) => c.status === "pending");
  const needsRevision = claims.filter((c) => c.status === "needs_revision");
  const draftsWithEvidence = drafts.filter(
    (d) => d.evidenceDocumentVersions.length > 0,
  );
  const evidenceCoverage =
    drafts.length === 0
      ? null
      : Math.round((draftsWithEvidence.length / drafts.length) * 1000) / 10;
  const unsupportedClaimRate =
    claims.length === 0
      ? null
      : Math.round((unsupported.length / claims.length) * 1000) / 10;
  const firstPassApprovalRate =
    claims.filter((c) => c.status !== "pending").length === 0
      ? null
      : Math.round(
          (supported.length /
            claims.filter((c) => c.status !== "pending").length) *
            1000,
        ) / 10;

  const now = Date.now();
  const reviewQueueAging = pending.map((c) => {
    const draft = drafts.find((d) => d.id === c.draftId);
    const created = draft ? Date.parse(draft.createdAt) : now;
    const ageHours = Math.max(0, Math.round((now - created) / 3_600_000));
    return { claimId: c.id, claimKey: c.claimKey, ageHours };
  });
  const medianQueueAgeHours =
    reviewQueueAging.length === 0
      ? null
      : (() => {
          const ages = reviewQueueAging
            .map((r) => r.ageHours)
            .sort((a, b) => a - b);
          const mid = Math.floor(ages.length / 2);
          return ages.length % 2 === 0
            ? (ages[mid - 1] + ages[mid]) / 2
            : ages[mid];
        })();

  return {
    dataKind: "observed_demo_activity" as const,
    window: "All in-memory demo sessions since process start (not a calendar window).",
    missingData:
      "Rates return null when denominator is zero. Synthetic seed scenarios exist before any sessions are run.",
    fieldMedical: {
      simulationCompletion: {
        value: completionRate,
        numerator: completed.length,
        denominator: sessions.length,
        definition:
          "Completed sessions / started sessions for filtered therapeutic area. Null if no sessions.",
      },
      validationRate: {
        value: validationRate,
        numerator: validated.length,
        denominator: evaluations.length,
        definition:
          "Reviewer-validated evaluations / provisional evaluations. Formal competency is never auto-approved.",
      },
      scientificAccuracyFlags: {
        value: evaluations.filter(
          (e) => e.evaluation.criticalInaccuracyFlags.length > 0,
        ).length,
        denominator: evaluations.length,
        definition:
          "Count of provisional evaluations with ≥1 critical inaccuracy flag.",
      },
      gapsByCategory,
      coachingNote:
        "Coaching assignment and reassessment remain in Field Medical coaching plans; validated simulation assessments do not auto-write readiness.",
    },
    medicalInformation: {
      evidenceRetrievalCoverage: {
        value: evidenceCoverage,
        numerator: draftsWithEvidence.length,
        denominator: drafts.length,
        definition:
          "SI drafts with ≥1 evidence document version / SI drafts created via scientific engine.",
      },
      draftTurnaround: {
        value: null as number | null,
        definition:
          "Median hours from inquiry submission to first SI draft. Null in demo until inquiry timestamps are joined to SI drafts in a persisted store.",
      },
      firstPassMedicalApprovalRate: {
        value: firstPassApprovalRate,
        numerator: supported.length,
        denominator: claims.filter((c) => c.status !== "pending").length,
        definition:
          "Supported claims / decided claims (excludes pending). Not external release rate.",
      },
      unsupportedClaimRate: {
        value: unsupportedClaimRate,
        numerator: unsupported.length,
        denominator: claims.length,
        definition: "Unsupported claims / all claims on SI drafts.",
      },
      reviewQueueAging: {
        pendingCount: pending.length,
        needsRevisionCount: needsRevision.length,
        medianAgeHours: medianQueueAgeHours,
        items: reviewQueueAging.slice(0, 20),
        definition:
          "Pending claim age from draft createdAt. Missing draft timestamps treated as now (age 0).",
      },
      revisionReasons: {
        needsRevisionNotes: needsRevision
          .map((c) => c.reviewerNotes)
          .filter((n): n is string => Boolean(n)),
        definition:
          "Free-text reviewer notes on needs_revision claims. Empty when reviewers leave notes blank.",
      },
    },
  };
}
