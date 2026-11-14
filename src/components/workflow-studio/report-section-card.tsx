"use client";

import { useState } from "react";
import { ClipboardPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getAgentById } from "@/domain/agents/registry";
import type { MockReportSectionId } from "@/domain/workflow-studio/mock-report";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import { AgentOwnershipChips } from "@/components/workflow-studio/agent-ownership-chips";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ReportSectionViewModel = {
  id: MockReportSectionId | string;
  title: string;
  body: string;
  agentIds: string[];
};

interface ReportSectionCardProps {
  section: ReportSectionViewModel;
  index: number;
  workflowId: MockReportWorkflowId;
  reportTitle: string;
  onAddTask: (input: {
    sectionId: MockReportSectionId | "custom";
    agentId: string;
    note: string;
    workflowId: MockReportWorkflowId;
    reportTitle: string;
  }) => void;
  className?: string;
}

export function ReportSectionCard({
  section,
  index,
  workflowId,
  reportTitle,
  onAddTask,
  className,
}: ReportSectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(
    section.agentIds[0] ?? "medical-drafting",
  );
  const primaryAgent = getAgentById(selectedAgentId);
  const sectionId = (section.id as MockReportSectionId) || "custom";

  function submitTask(kind: "evaluate" | "add") {
    const trimmed = note.trim();
    const defaultNote =
      kind === "evaluate"
        ? `Evaluate “${section.title}” with human oversight. Review provisional claims before any external use.`
        : `Follow up on “${section.title}”.`;
    onAddTask({
      sectionId,
      agentId: selectedAgentId,
      note: trimmed || defaultNote,
      workflowId,
      reportTitle,
    });
    setNote("");
    setExpanded(false);
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_0_rgba(23,33,43,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(23,33,43,0.06)]",
        className,
      )}
      aria-labelledby={`report-section-${section.id}`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#2563EB] to-[#93C5FD]" aria-hidden />
      <div className="space-y-3 p-5 pl-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#17212B]/55">
                Section {String(index + 1).padStart(2, "0")}
              </span>
              <span className="rounded-md border border-[#DBEAFE] bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#1D4ED8]">
                Agent-owned
              </span>
            </div>
            <h4
              id={`report-section-${section.id}`}
              className="text-[15px] font-semibold tracking-tight text-[#17212B]"
            >
              {section.title}
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#DCE3EE] bg-[#F8FAFF] text-[#1D4ED8] hover:bg-[#EEF4FF]"
              onClick={() => submitTask("evaluate")}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Evaluate with agent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#E5E7EB]"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              <ClipboardPlus className="size-3.5" aria-hidden />
              Add to agent task
            </Button>
          </div>
        </div>

        <AgentOwnershipChips agentIds={section.agentIds} />

        <p className="text-[13px] leading-relaxed text-[#17212B]/75">
          {section.body}
        </p>

        {primaryAgent ? (
          <p className="text-[11px] text-[#17212B]/45">
            Primary owner:{" "}
            <Link
              href={primaryAgent.route}
              className="font-medium text-[#2563EB] hover:underline"
            >
              {primaryAgent.name}
            </Link>
          </p>
        ) : null}

        {expanded ? (
          <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/55">
                Agent for task
              </span>
              <select
                className="h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-2 text-[13px] text-[#17212B]"
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
              >
                {section.agentIds.map((agentId) => {
                  const agent = getAgentById(agentId);
                  return (
                    <option key={agentId} value={agentId}>
                      {agent?.name ?? agentId}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/55">
                Note (demo)
              </span>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for the follow-up task…"
                className="min-h-20 resize-y bg-white text-[13px]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                onClick={() => submitTask("add")}
              >
                Save demo task
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
