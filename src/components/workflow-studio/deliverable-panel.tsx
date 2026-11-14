"use client";

import { useEffect, useRef } from "react";
import {
  isMockReportWorkflowId,
  type MockReportSectionId,
  type MockReportWorkflowId,
} from "@/domain/workflow-studio/mock-report";
import type {
  WorkflowDeliverable,
  WorkflowStudioId,
} from "@/domain/workflow-studio/types";
import { StructuredDeliverableView } from "@/components/workflow-studio/structured-deliverable-view";

interface DeliverablePanelProps {
  workflowId: WorkflowStudioId;
  deliverable: WorkflowDeliverable;
  open: boolean;
  onHighlightAgent?: (agentId: string | null) => void;
}

function toStructuredSections(deliverable: WorkflowDeliverable) {
  return deliverable.sections.map((section, index) => ({
    id: (section.id as MockReportSectionId | undefined) ?? `section-${index}`,
    title: section.heading,
    body: section.body,
    agentIds: section.agentIds ?? [],
  }));
}

export function DeliverablePanel({
  workflowId,
  deliverable,
  open,
  onHighlightAgent,
}: DeliverablePanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    if (typeof panelRef.current.scrollIntoView === "function") {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [open]);

  if (!open) return null;

  const structured = isMockReportWorkflowId(workflowId);

  return (
    <section
      ref={panelRef}
      className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6"
      aria-labelledby="workflow-deliverable-heading"
      tabIndex={-1}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3
          id="workflow-deliverable-heading"
          className="text-[16px] font-semibold text-[#17212B]"
        >
          Pathway deliverable
        </h3>
        <span className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/55">
          Fixture packet
        </span>
      </div>

      {structured ? (
        <StructuredDeliverableView
          workflowId={workflowId as MockReportWorkflowId}
          title={deliverable.title}
          summary={deliverable.summary}
          sections={toStructuredSections(deliverable)}
          sourceLabel="fixture packet"
          disclaimer={deliverable.disclaimer}
          onHighlightAgent={onHighlightAgent}
        />
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-semibold text-[#17212B]">
              {deliverable.title}
            </h4>
            <p className="mt-2 text-[14px] leading-relaxed text-[#17212B]/75">
              {deliverable.summary}
            </p>
          </div>
          <div className="space-y-3">
            {deliverable.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4"
              >
                <h5 className="text-[13px] font-semibold text-[#17212B]">
                  {section.heading}
                </h5>
                <p className="mt-1 text-[13px] leading-relaxed text-[#17212B]/70">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
          <p
            className="border-t border-[#E5E7EB] pt-3 text-[12px] leading-relaxed text-[#17212B]/55"
            role="note"
          >
            {deliverable.disclaimer}
          </p>
        </div>
      )}
    </section>
  );
}
