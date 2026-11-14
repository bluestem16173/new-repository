"use client";

import { FileText, Package } from "lucide-react";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import { useAgentFollowUpTasks } from "@/hooks/use-agent-follow-up-tasks";
import { AgentFollowUpTaskList } from "@/components/workflow-studio/agent-follow-up-task-list";
import { DemoOversightBanner } from "@/components/workflow-studio/demo-oversight-banner";
import {
  ReportSectionCard,
  type ReportSectionViewModel,
} from "@/components/workflow-studio/report-section-card";
import { SendToDataRoomButton } from "@/components/data-room/send-to-data-room-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StructuredDeliverableViewProps {
  workflowId: MockReportWorkflowId;
  title: string;
  summary: string;
  sections: ReportSectionViewModel[];
  sourceLabel?: string;
  generatedAt?: string;
  disclaimer?: string;
  className?: string;
}

export function StructuredDeliverableView({
  workflowId,
  title,
  summary,
  sections,
  sourceLabel,
  generatedAt,
  disclaimer,
  className,
}: StructuredDeliverableViewProps) {
  const {
    tasks,
    error,
    addTask,
    toggleStatus,
    removeTask,
  } = useAgentFollowUpTasks(workflowId);

  return (
    <div className={cn("space-y-5", className)}>
      <DemoOversightBanner />

      <header className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-white to-[#F7FAFC]">
        <div className="border-b border-[#E5E7EB]/80 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DBEAFE] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1D4ED8]">
                  <FileText className="size-3" aria-hidden />
                  Deliverable packet
                </span>
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 font-medium text-amber-950"
                >
                  Illustrative Demo
                </Badge>
                {sourceLabel ? (
                  <Badge
                    variant="outline"
                    className="border-[#E5E7EB] bg-white font-medium text-[#17212B]/65"
                  >
                    {sourceLabel}
                  </Badge>
                ) : null}
              </div>
              <h3 className="text-[1.25rem] font-semibold tracking-tight text-[#17212B] sm:text-[1.35rem]">
                {title}
              </h3>
              <p className="max-w-3xl text-[14px] leading-relaxed text-[#17212B]/70">
                {summary}
              </p>
            </div>
            <SendToDataRoomButton
              workflowId={workflowId}
              title={title}
              summary={summary}
              sections={sections}
            />
          </div>
        </div>
        <div className="grid gap-px bg-[#E5E7EB] sm:grid-cols-3">
          <div className="bg-white/90 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Sections
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[#17212B]">
              {sections.length}
            </p>
          </div>
          <div className="bg-white/90 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Owning agents
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[#17212B]">
              {new Set(sections.flatMap((section) => section.agentIds)).size}
            </p>
          </div>
          <div className="bg-white/90 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Open demo tasks
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[#17212B]">
              {tasks.filter((task) => task.status === "open").length}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            index={index}
            workflowId={workflowId}
            reportTitle={title}
            onAddTask={addTask}
          />
        ))}
      </div>

      <AgentFollowUpTaskList
        workflowId={workflowId}
        reportTitle={title}
        tasks={tasks}
        onAddCustom={addTask}
        onToggle={toggleStatus}
        onRemove={removeTask}
        error={error}
      />

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#E5E7EB] bg-white px-4 py-3 text-[12px] text-[#17212B]/55">
        <p className="inline-flex items-center gap-1.5">
          <Package className="size-3.5" aria-hidden />
          {disclaimer ??
            "Illustrative Demo Data only — not for clinical decision-making."}
        </p>
        {generatedAt ? (
          <p>Generated {new Date(generatedAt).toLocaleString()}</p>
        ) : null}
      </footer>
    </div>
  );
}
