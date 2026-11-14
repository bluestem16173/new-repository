"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateWorkflowStudioMockReportAction } from "@/app/actions/workflow-studio";
import {
  isMockReportWorkflowId,
  type GeneratedMockReport,
} from "@/domain/workflow-studio/mock-report";
import type { WorkflowStudioId } from "@/domain/workflow-studio/types";
import { StructuredDeliverableView } from "@/components/workflow-studio/structured-deliverable-view";
import { Button } from "@/components/ui/button";

interface MockReportPanelProps {
  workflowId: WorkflowStudioId;
}

export function MockReportPanel({ workflowId }: MockReportPanelProps) {
  const supported = isMockReportWorkflowId(workflowId);
  const [report, setReport] = useState<GeneratedMockReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!supported) return null;

  function onGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateWorkflowStudioMockReportAction(workflowId);
      if (!result.ok) {
        setReport(null);
        setError(result.error);
        return;
      }
      setReport(result.report);
    });
  }

  return (
    <section
      className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6"
      aria-labelledby="mock-report-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id="mock-report-heading"
            className="text-[16px] font-semibold text-[#17212B]"
          >
            Generate mock report
          </h3>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[#17212B]/70">
            Creates a structured illustrative demo report from allowlisted
            synthetic fixture context. Prefer JSON sections with owning agents;
            falls back to fixture compose when the provider is unavailable.
          </p>
        </div>
        <Button
          type="button"
          className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          disabled={pending}
          onClick={onGenerate}
          aria-busy={pending}
        >
          <Sparkles className="size-4" aria-hidden />
          {pending ? "Generating…" : "Generate mock report"}
        </Button>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="mt-5" aria-live="polite">
          <StructuredDeliverableView
            workflowId={report.workflowId}
            title={report.title}
            summary={report.summary}
            sections={report.sections.map((section) => ({
              id: section.id,
              title: section.title,
              body: section.body,
              agentIds: section.agentIds,
            }))}
            sourceLabel={
              report.source === "openai" ? "provider JSON" : "fixture compose"
            }
            generatedAt={report.generatedAt}
            disclaimer={report.oversightLabel}
          />
        </div>
      ) : null}
    </section>
  );
}
