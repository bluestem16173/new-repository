"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateWorkflowStudioMockReportAction } from "@/app/actions/workflow-studio";
import {
  isMockReportWorkflowId,
  type GeneratedMockReport,
} from "@/domain/workflow-studio/mock-report";
import type { WorkflowStudioId } from "@/domain/workflow-studio/types";
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
      className="rounded-xl border border-[#E5E7EB] bg-white p-5"
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
            Creates an illustrative demo report from allowlisted synthetic
            fixture context only. Output requires human oversight and is never
            auto-released as verified medical content.
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
        <article
          className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[#17212B]">
              {report.title}
            </p>
            <span className="rounded-md border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-950">
              Demo AI output
            </span>
            <span className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#17212B]/60">
              {report.source === "openai" ? "provider" : "fixture compose"}
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-amber-950" role="note">
            {report.oversightLabel}
          </p>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md border border-[#E5E7EB] bg-white p-3 text-[13px] leading-relaxed text-[#17212B]">
            {report.body}
          </pre>
          <p className="text-[11px] text-[#17212B]/50">
            Generated at {new Date(report.generatedAt).toLocaleString()}
          </p>
        </article>
      ) : null}
    </section>
  );
}
