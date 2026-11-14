"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getAgentById } from "@/domain/agents/registry";
import {
  assembleFinalReport,
  buildSectionAssignmentTasks,
  buildWalkthroughSteps,
  WALKTHROUGH_DEMO_LABEL,
  type FinalReport,
  type SectionEvaluation,
  type WalkthroughStep,
} from "@/domain/workflow-studio/evaluation-walkthrough";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import type { CreateAgentFollowUpTaskInput } from "@/domain/workflow-studio/agent-follow-up-tasks";
import { evaluateWalkthroughSectionAction } from "@/app/actions/workflow-studio";
import type { ReportSectionViewModel } from "@/components/workflow-studio/report-section-card";
import { FinalReportView } from "@/components/workflow-studio/final-report-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EvaluationWalkthroughPanelProps {
  workflowId: MockReportWorkflowId;
  reportTitle: string;
  reportSummary: string;
  sections: ReportSectionViewModel[];
  existingTaskKeys: Array<{ sectionId: string; agentId: string }>;
  onAssignTasks: (inputs: CreateAgentFollowUpTaskInput[]) => void;
  onHighlightAgent?: (agentId: string | null) => void;
  onHighlightSection?: (sectionId: string | null) => void;
}

export function EvaluationWalkthroughPanel({
  workflowId,
  reportTitle,
  reportSummary,
  sections,
  existingTaskKeys,
  onAssignTasks,
  onHighlightAgent,
  onHighlightSection,
}: EvaluationWalkthroughPanelProps) {
  const sectionSignature = sections
    .map(
      (section) =>
        `${section.id}:${section.title}:${section.agentIds.join(",")}`,
    )
    .join("|");

  const sectionInputs = useMemo(
    () =>
      sections.map((section) => ({
        id: String(section.id),
        title: section.title,
        body: section.body,
        agentIds: section.agentIds,
      })),
    // Intentional: rebuild only when section identity/content signature changes,
    // not when parent passes a fresh array reference each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionSignature],
  );

  const [steps, setSteps] = useState<WalkthroughStep[]>(() =>
    buildWalkthroughSteps(sectionInputs),
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setSteps(buildWalkthroughSteps(sectionInputs));
    setActiveIndex(null);
    setRunning(false);
    setFinalReport(null);
  }, [sectionSignature, sectionInputs]);

  useEffect(() => {
    if (activeIndex === null) {
      onHighlightAgent?.(null);
      onHighlightSection?.(null);
      return;
    }
    const step = steps[activeIndex];
    if (!step) return;
    onHighlightAgent?.(step.agentId);
    onHighlightSection?.(step.sectionId);
    const el = sectionRefs.current[step.sectionId];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex, steps, onHighlightAgent, onHighlightSection]);

  const completedCount = steps.filter((step) => step.status === "done").length;
  const progressPct =
    steps.length === 0 ? 0 : Math.round((completedCount / steps.length) * 100);

  function assignAgents() {
    const assignments = buildSectionAssignmentTasks({
      workflowId,
      reportTitle,
      sections: sectionInputs,
      existing: existingTaskKeys,
    });
    if (assignments.length > 0) {
      onAssignTasks(assignments);
    }
  }

  function evaluateStep(index: number) {
    const step = steps[index];
    if (!step) return;

    setError(null);
    setActiveIndex(index);
    setSteps((current) =>
      current.map((item, itemIndex) => ({
        ...item,
        status:
          itemIndex === index
            ? "active"
            : item.status === "done"
              ? "done"
              : "pending",
      })),
    );

    startTransition(async () => {
      const result = await evaluateWalkthroughSectionAction({
        workflowId,
        sectionId: step.sectionId,
        sectionTitle: step.sectionTitle,
        sectionBody: step.sectionBody,
        agentId: step.agentId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSteps((current) => {
        const next = current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, status: "done" as const, evaluation: result.evaluation }
            : item,
        );
        return next;
      });
    });
  }

  function startWalkthrough() {
    assignAgents();
    setFinalReport(null);
    setRunning(true);
    evaluateStep(0);
  }

  function advanceWalkthrough() {
    if (activeIndex === null) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex >= steps.length) {
      finishWalkthrough();
      return;
    }
    evaluateStep(nextIndex);
  }

  function finishWalkthrough(currentSteps?: WalkthroughStep[]) {
    const source = currentSteps ?? steps;
    const evaluations = source
      .map((step) => step.evaluation)
      .filter((evaluation): evaluation is SectionEvaluation => Boolean(evaluation));

    // If finishing mid-flight before state flush, include any just-completed evals
    const report = assembleFinalReport({
      workflowId,
      packetTitle: reportTitle,
      packetSummary: reportSummary,
      sections: sectionInputs,
      evaluations,
    });
    setFinalReport(report);
    setRunning(false);
    setActiveIndex(null);
    onHighlightAgent?.(null);
    onHighlightSection?.(null);
  }

  function resetWalkthrough() {
    setSteps(buildWalkthroughSteps(sectionInputs));
    setActiveIndex(null);
    setRunning(false);
    setFinalReport(null);
    setError(null);
    onHighlightAgent?.(null);
    onHighlightSection?.(null);
  }

  const activeStep = activeIndex !== null ? steps[activeIndex] : null;
  const allDone = steps.length > 0 && steps.every((step) => step.status === "done");

  return (
    <section
      className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5"
      aria-labelledby="evaluation-walkthrough-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="evaluation-walkthrough-heading"
              className="text-[15px] font-semibold text-[#17212B]"
            >
              Evaluation walkthrough
            </h3>
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 font-medium text-amber-950"
            >
              Illustrative Demo
            </Badge>
          </div>
          <p className="max-w-2xl text-[12px] leading-relaxed text-[#17212B]/60">
            {WALKTHROUGH_DEMO_LABEL} Auto-assigns each section to its owning
            agent, steps through evaluations, then assembles a Final Report.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[#E5E7EB]"
            onClick={assignAgents}
          >
            Assign section agents
          </Button>
          {!running && !allDone ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={startWalkthrough}
              disabled={pending || sections.length === 0}
            >
              <Play className="size-3.5" aria-hidden />
              Run evaluation walkthrough
            </Button>
          ) : null}
          {running ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={advanceWalkthrough}
              disabled={pending || activeStep?.status === "active"}
            >
              <ChevronRight className="size-3.5" aria-hidden />
              {activeIndex !== null && activeIndex >= steps.length - 1
                ? "Assemble Final Report"
                : "Next agent"}
            </Button>
          ) : null}
          {allDone && !finalReport ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={() => finishWalkthrough()}
            >
              <Sparkles className="size-3.5" aria-hidden />
              View Final Report
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resetWalkthrough}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] text-[#17212B]/55">
          <span>
            Progress · {completedCount}/{steps.length} sections evaluated
          </span>
          <span>{progressPct}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-[#E8EEF7]"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Evaluation walkthrough progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const agent = getAgentById(step.agentId);
          const isActive = activeIndex === step.index;
          return (
            <li key={step.sectionId}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-[#2563EB] bg-[#EEF4FF] ring-2 ring-[#2563EB]/20"
                    : step.status === "done"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-[#E5E7EB] bg-[#FAFBFC]",
                )}
                onClick={() => {
                  setActiveIndex(step.index);
                  onHighlightAgent?.(step.agentId);
                  onHighlightSection?.(step.sectionId);
                }}
              >
                <span className="mt-0.5 text-[#2563EB]">
                  {step.status === "done" ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <Circle
                      className={cn(
                        "size-3.5",
                        isActive ? "text-[#2563EB]" : "text-[#17212B]/30",
                      )}
                    />
                  )}
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block truncate text-[12px] font-semibold text-[#17212B]">
                    {step.sectionTitle}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#17212B]/55">
                    {agent?.icon ? (
                      <Image
                        src={agent.icon}
                        alt=""
                        width={14}
                        height={14}
                        unoptimized
                        className="size-3.5 object-contain"
                      />
                    ) : null}
                    {step.agentName}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="text-[12px] text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {activeStep ? (
        <article
          ref={(node) => {
            sectionRefs.current[activeStep.sectionId] = node;
          }}
          className={cn(
            "rounded-xl border p-4 transition-shadow",
            activeStep.status === "active"
              ? "border-[#2563EB] bg-[#F8FAFF] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
              : "border-[#E5E7EB] bg-[#FAFBFC]",
          )}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                Step {activeStep.index + 1} of {steps.length}
                {pending && activeStep.status === "active"
                  ? " · evaluating…"
                  : ""}
              </p>
              <h4 className="text-[15px] font-semibold text-[#17212B]">
                {activeStep.sectionTitle}
              </h4>
              <p className="text-[12px] text-[#17212B]/60">
                Assigned agent:{" "}
                <Link
                  href={
                    getAgentById(activeStep.agentId)?.route ??
                    `/agents/${activeStep.agentId}`
                  }
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  {activeStep.agentName}
                </Link>
              </p>
            </div>
            {activeStep.evaluation ? (
              <Badge
                variant="outline"
                className="border-[#E5E7EB] bg-white font-medium text-[#17212B]/60"
              >
                {activeStep.evaluation.source === "openai"
                  ? "provider eval"
                  : "fixture eval"}
              </Badge>
            ) : null}
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#17212B]/70">
            {activeStep.sectionBody}
          </p>

          {activeStep.evaluation ? (
            <div className="mt-4 space-y-2 rounded-lg border border-[#DCE3EE] bg-white p-3">
              <p className="text-[13px] font-semibold text-[#17212B]">
                {activeStep.evaluation.headline}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-[#17212B]/75">
                {activeStep.evaluation.findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[#17212B]/50">
                Confidence: {activeStep.evaluation.confidence.replaceAll("_", " ")}{" "}
                · {activeStep.evaluation.evidenceNotes}
              </p>
            </div>
          ) : pending ? (
            <p className="mt-4 text-[13px] text-[#17212B]/55">
              Generating illustrative evaluation notes…
            </p>
          ) : null}
        </article>
      ) : null}

      {finalReport ? (
        <FinalReportView report={finalReport} />
      ) : null}
    </section>
  );
}
