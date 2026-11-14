"use client";

import Image from "next/image";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  NODE_STATUS_LABELS,
  NODE_STATUS_STYLES,
  VALIDATION_LABELS,
  VALIDATION_STYLES,
} from "@/domain/workflow-studio/labels";
import type {
  NodeRunStatus,
  ValidationState,
} from "@/domain/workflow-studio/types";

export type AgentFlowNodeData = {
  agentName: string;
  agentIcon: string;
  task: string;
  status: NodeRunStatus;
  inputSummary: string;
  outputSummary: string;
  validation: ValidationState;
  selected?: boolean;
  layout: "horizontal" | "vertical";
};

export type AgentFlowNodeType = Node<AgentFlowNodeData, "agent">;

export function AgentFlowNode({ data, selected }: NodeProps<AgentFlowNodeType>) {
  const horizontal = data.layout === "horizontal";

  return (
    <div
      className={cn(
        "w-[240px] rounded-xl border bg-white p-3 shadow-sm transition-shadow",
        selected
          ? "border-[#2563EB] ring-2 ring-[#2563EB]/25"
          : "border-[#E5E7EB]",
      )}
      role="group"
      aria-label={`${data.agentName}: ${data.task}`}
    >
      <Handle
        type="target"
        position={horizontal ? Position.Left : Position.Top}
        className="!size-2.5 !border-[#2563EB] !bg-white"
      />
      <div className="flex items-start gap-2.5">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E7EB] bg-[#FAFBFC]">
          <Image
            src={data.agentIcon}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="size-9 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[13px] font-semibold text-[#17212B]">
            {data.agentName}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-[#17212B]/70">
            {data.task}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
            NODE_STATUS_STYLES[data.status],
          )}
        >
          {NODE_STATUS_LABELS[data.status]}
        </span>
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
            VALIDATION_STYLES[data.validation],
          )}
        >
          {VALIDATION_LABELS[data.validation]}
        </span>
      </div>
      <div className="mt-2 space-y-1 border-t border-[#E5E7EB] pt-2 text-[10px] leading-snug text-[#17212B]/65">
        <p>
          <span className="font-medium text-[#17212B]/80">In:</span>{" "}
          {data.inputSummary}
        </p>
        <p>
          <span className="font-medium text-[#17212B]/80">Out:</span>{" "}
          {data.outputSummary}
        </p>
      </div>
      <Handle
        type="source"
        position={horizontal ? Position.Right : Position.Bottom}
        className="!size-2.5 !border-[#2563EB] !bg-white"
      />
    </div>
  );
}
