"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NODE_STATUS_LABELS,
  NODE_STATUS_STYLES,
  VALIDATION_LABELS,
  VALIDATION_STYLES,
} from "@/domain/workflow-studio/labels";
import type { WorkflowNodeFixture } from "@/domain/workflow-studio/types";
import type { MedIntelAgent } from "@/domain/agents/registry";
import { AGENT_CATEGORY_LABELS, AGENT_STATUS_LABELS } from "@/domain/agents/registry";
import { cn } from "@/lib/utils";

interface DetailsPanelProps {
  node: WorkflowNodeFixture | null;
  agent: MedIntelAgent | null;
  onClose: () => void;
}

export function DetailsPanel({ node, agent, onClose }: DetailsPanelProps) {
  if (!node || !agent) {
    return (
      <aside
        className="flex h-full flex-col justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] p-5 text-sm text-[#17212B]/60"
        aria-label="Agent details"
      >
        Select an agent node on the canvas to inspect task, status, validation,
        and input/output summaries.
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5"
      aria-label={`${agent.name} details`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FAFBFC]">
            <Image
              src={agent.icon}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="size-11 object-contain"
            />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#17212B]">
              {agent.name}
            </h3>
            <p className="text-[12px] text-[#17212B]/55">
              {AGENT_CATEGORY_LABELS[agent.category]} ·{" "}
              {AGENT_STATUS_LABELS[agent.status]}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Clear node selection"
        >
          Close
        </Button>
      </div>

      <p className="text-[14px] leading-relaxed text-[#17212B]/75">
        {agent.description}
      </p>

      <div className="space-y-2">
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-[#17212B]/55">
          Pathway task
        </h4>
        <p className="text-[14px] text-[#17212B]">{node.task}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={cn("font-medium", NODE_STATUS_STYLES[node.status])}
        >
          {NODE_STATUS_LABELS[node.status]}
        </Badge>
        <Badge
          variant="outline"
          className={cn("font-medium", VALIDATION_STYLES[node.validation])}
        >
          Validation: {VALIDATION_LABELS[node.validation]}
        </Badge>
      </div>

      <dl className="space-y-3 text-[13px] leading-relaxed">
        <div>
          <dt className="font-medium text-[#17212B]">Input summary</dt>
          <dd className="text-[#17212B]/75">{node.inputSummary}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#17212B]">Output summary</dt>
          <dd className="text-[#17212B]/75">{node.outputSummary}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#17212B]">Validation notes</dt>
          <dd className="text-[#17212B]/75">{node.validationNotes}</dd>
        </div>
      </dl>

      {agent.workflowHref ? (
        <Button
          variant="outline"
          className="mt-auto border-[#E5E7EB]"
          render={<Link href={agent.workflowHref} />}
          role="link"
        >
          Open related workspace
        </Button>
      ) : null}
    </aside>
  );
}
