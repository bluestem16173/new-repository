"use client";

import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { getAgentById } from "@/domain/agents/registry";
import type { FinalReport } from "@/domain/workflow-studio/evaluation-walkthrough";
import { AgentOwnershipChips } from "@/components/workflow-studio/agent-ownership-chips";
import { DemoOversightBanner } from "@/components/workflow-studio/demo-oversight-banner";
import { SendToDataRoomButton } from "@/components/data-room/send-to-data-room-button";
import { Badge } from "@/components/ui/badge";

interface FinalReportViewProps {
  report: FinalReport;
}

export function FinalReportView({ report }: FinalReportViewProps) {
  return (
    <article
      className="space-y-5 rounded-2xl border border-[#2563EB]/25 bg-gradient-to-br from-[#F8FAFF] via-white to-[#F7FAFC] p-5 sm:p-6"
      aria-labelledby="final-report-heading"
    >
      <DemoOversightBanner label={report.oversightLabel} />

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DBEAFE] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1D4ED8]">
                <FileCheck2 className="size-3" aria-hidden />
                Final report
              </span>
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 font-medium text-amber-950"
              >
                Illustrative Demo
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-medium text-emerald-900"
              >
                <ShieldCheck className="size-3" aria-hidden />
                {report.evaluatedCount}/{report.sections.length} evaluated
              </Badge>
            </div>
            <h3
              id="final-report-heading"
              className="text-[1.35rem] font-semibold tracking-tight text-[#17212B]"
            >
              {report.title}
            </h3>
            <p className="max-w-3xl text-[14px] leading-relaxed text-[#17212B]/70">
              {report.summary}
            </p>
            <p className="text-[12px] text-[#17212B]/50">
              {report.walkthroughLabel}
            </p>
          </div>
          <SendToDataRoomButton
            workflowId={report.workflowId}
            title={report.title}
            summary={report.summary}
            sections={report.sections.map((section) => ({
              id: section.id,
              title: section.title,
              body: [
                section.body,
                section.evaluation
                  ? `\n\nAgent evaluation (${section.evaluation.agentName}): ${section.evaluation.headline}\n- ${section.evaluation.findings.join("\n- ")}\n${section.evaluation.evidenceNotes}`
                  : "",
              ]
                .join("")
                .trim(),
              agentIds: section.agentIds,
            }))}
          />
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#E5E7EB] sm:grid-cols-3">
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Packet
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#17212B]">
              {report.packetTitle}
            </p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Workflow
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#17212B]">
              {report.workflowId}
            </p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Assembled
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#17212B]">
              {new Date(report.completedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#17212B]/45">
          Original packet summary
        </h4>
        <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#17212B]/75">
          {report.packetSummary}
        </p>
      </section>

      <div className="space-y-3">
        {report.sections.map((section, index) => {
          const evaluation = section.evaluation;
          const primary = evaluation
            ? getAgentById(evaluation.agentId)
            : getAgentById(section.agentIds[0] ?? "");
          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_0_rgba(23,33,43,0.04)]"
            >
              <div className="border-b border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/55">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h4 className="text-[15px] font-semibold text-[#17212B]">
                    {section.title}
                  </h4>
                  {evaluation ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 font-medium text-emerald-900"
                    >
                      Evaluated
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 font-medium text-amber-950"
                    >
                      Pending eval
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <AgentOwnershipChips agentIds={section.agentIds} />
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="space-y-2 border-b border-[#E5E7EB] p-4 lg:border-r lg:border-b-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                    Packet section
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#17212B]/75">
                    {section.body}
                  </p>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
                    Agent evaluation
                  </p>
                  {evaluation ? (
                    <div className="space-y-2">
                      <p className="text-[13px] font-semibold text-[#17212B]">
                        {evaluation.headline}
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-[#17212B]/75">
                        {evaluation.findings.map((finding) => (
                          <li key={finding}>{finding}</li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-[#17212B]/50">
                        {primary ? (
                          <>
                            Owner:{" "}
                            <Link
                              href={primary.route}
                              className="text-[#2563EB] hover:underline"
                            >
                              {primary.name}
                            </Link>
                            {" · "}
                          </>
                        ) : null}
                        {evaluation.confidence.replaceAll("_", " ")} ·{" "}
                        {evaluation.evidenceNotes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#17212B]/55">
                      No evaluation captured for this section.
                    </p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
