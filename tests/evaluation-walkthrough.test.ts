import { describe, expect, it, vi, afterEach } from "vitest";
import {
  assembleFinalReport,
  buildSectionAssignmentTasks,
  buildWalkthroughSteps,
  composeFixtureSectionEvaluation,
} from "@/domain/workflow-studio/evaluation-walkthrough";
import { evaluateWalkthroughSection } from "@/services/workflow-studio/evaluation-walkthrough";
import type { User } from "@/domain/types";

const sections = [
  {
    id: "visit-context",
    title: "Visit Context",
    body: "Dr. Mira Chen visit context (fictional).",
    agentIds: ["medical-drafting", "literature-scout"],
  },
  {
    id: "key-evidence",
    title: "Key Evidence",
    body: "Four allowlisted synthetic passages.",
    agentIds: ["evidence-analyst", "literature-scout"],
  },
];

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "msl",
  email: "alex.chen@demo.medintel.local",
  fullName: "Alex Chen",
  createdAt: "",
  updatedAt: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("evaluation walkthrough", () => {
  it("auto-assigns each section to its primary owning agent", () => {
    const steps = buildWalkthroughSteps(sections);
    expect(steps).toHaveLength(2);
    expect(steps[0]?.agentId).toBe("medical-drafting");
    expect(steps[1]?.agentId).toBe("evidence-analyst");

    const assignments = buildSectionAssignmentTasks({
      workflowId: "kol-meeting-prep",
      reportTitle: "KOL Packet",
      sections,
    });
    expect(assignments).toHaveLength(2);
    expect(assignments[0]?.note).toMatch(/Visit Context/);
    expect(assignments[0]?.agentId).toBe("medical-drafting");
  });

  it("skips assignment when section+agent task already exists", () => {
    const assignments = buildSectionAssignmentTasks({
      workflowId: "kol-meeting-prep",
      reportTitle: "KOL Packet",
      sections,
      existing: [{ sectionId: "visit-context", agentId: "medical-drafting" }],
    });
    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.sectionId).toBe("key-evidence");
  });

  it("composes fixture evaluations with demo labels and no clinical auto-claims", () => {
    const evaluation = composeFixtureSectionEvaluation({
      sectionId: "key-evidence",
      sectionTitle: "Key Evidence",
      sectionBody: sections[1]!.body,
      agentId: "evidence-analyst",
    });
    expect(evaluation.source).toBe("fixture_compose");
    expect(evaluation.confidence).toBe("needs_review");
    expect(evaluation.evidenceNotes.toLowerCase()).toMatch(
      /untrusted|review|oversight|human/,
    );
    expect(evaluation.findings.join(" ").toLowerCase()).not.toMatch(
      /approved for clinical use|definitive clinical/,
    );
  });

  it("assembles a final report consolidating packet + evaluations", () => {
    const evaluations = sections.map((section) =>
      composeFixtureSectionEvaluation({
        sectionId: section.id,
        sectionTitle: section.title,
        sectionBody: section.body,
        agentId: section.agentIds[0]!,
      }),
    );
    const report = assembleFinalReport({
      workflowId: "kol-meeting-prep",
      packetTitle: "KOL Meeting Prep Packet",
      packetSummary: "Illustrative briefing.",
      sections,
      evaluations,
    });
    expect(report.title).toMatch(/Final Report/);
    expect(report.evaluatedCount).toBe(2);
    expect(report.sections[0]?.evaluation?.agentId).toBe("medical-drafting");
    expect(report.oversightLabel.toLowerCase()).toContain("oversight");
    expect(report.walkthroughLabel.toLowerCase()).toContain("illustrative");
  });

  it("evaluates via fixture path when OpenAI key absent", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_API_Key", "");
    const evaluation = await evaluateWalkthroughSection({
      user,
      sectionId: "visit-context",
      sectionTitle: "Visit Context",
      sectionBody: sections[0]!.body,
      agentId: "medical-drafting",
      allowlistedContext: "Allowlisted synthetic fixture context only.",
    });
    expect(evaluation.source).toBe("fixture_compose");
    expect(evaluation.headline.toLowerCase()).toContain("visit");
  });
});
