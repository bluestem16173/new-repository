"use client";

import { useEffect, useRef } from "react";
import type { WorkflowDeliverable } from "@/domain/workflow-studio/types";

interface DeliverablePanelProps {
  deliverable: WorkflowDeliverable;
  open: boolean;
}

export function DeliverablePanel({ deliverable, open }: DeliverablePanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    if (typeof panelRef.current.scrollIntoView === "function") {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [open]);

  if (!open) return null;

  return (
    <section
      ref={panelRef}
      className="rounded-xl border border-[#E5E7EB] bg-white p-5"
      aria-labelledby="workflow-deliverable-heading"
      tabIndex={-1}
    >
      <h3
        id="workflow-deliverable-heading"
        className="text-[16px] font-semibold text-[#17212B]"
      >
        {deliverable.title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[#17212B]/75">
        {deliverable.summary}
      </p>
      <div className="mt-4 space-y-4">
        {deliverable.sections.map((section) => (
          <div key={section.heading}>
            <h4 className="text-[13px] font-semibold text-[#17212B]">
              {section.heading}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-[#17212B]/70">
              {section.body}
            </p>
          </div>
        ))}
      </div>
      <p
        className="mt-4 border-t border-[#E5E7EB] pt-3 text-[12px] leading-relaxed text-[#17212B]/55"
        role="note"
      >
        {deliverable.disclaimer}
      </p>
    </section>
  );
}
