"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { getAgentById } from "@/domain/agents/registry";
import {
  AGENT_FOLLOW_UP_DEMO_LABEL,
  sectionTitleFor,
  type AgentFollowUpTask,
} from "@/domain/workflow-studio/agent-follow-up-tasks";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AgentFollowUpTaskListProps {
  workflowId: MockReportWorkflowId;
  reportTitle: string;
  tasks: AgentFollowUpTask[];
  onAddCustom: (input: {
    sectionId: "custom";
    agentId: string;
    note: string;
    workflowId: MockReportWorkflowId;
    reportTitle: string;
  }) => void;
  onToggle: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  error?: string | null;
}

const CUSTOM_AGENT_OPTIONS = [
  "literature-scout",
  "evidence-analyst",
  "knowledge-matcher",
  "kol-simulator",
  "protocol-intelligence",
  "medical-drafting",
  "coaching-advisor",
  "scientific-examiner",
];

export function AgentFollowUpTaskList({
  workflowId,
  reportTitle,
  tasks,
  onAddCustom,
  onToggle,
  onRemove,
  error,
}: AgentFollowUpTaskListProps) {
  const [note, setNote] = useState("");
  const [agentId, setAgentId] = useState("medical-drafting");

  function addCustom() {
    const trimmed = note.trim();
    if (!trimmed) return;
    onAddCustom({
      sectionId: "custom",
      agentId,
      note: trimmed,
      workflowId,
      reportTitle,
    });
    setNote("");
  }

  return (
    <section
      className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-5"
      aria-labelledby="agent-follow-up-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id="agent-follow-up-heading"
            className="text-[15px] font-semibold text-[#17212B]"
          >
            Agent follow-up tasks
          </h3>
          <p className="max-w-2xl text-[12px] leading-relaxed text-[#17212B]/60">
            {AGENT_FOLLOW_UP_DEMO_LABEL}
          </p>
        </div>
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
          Demo store
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[13px] text-[#17212B] sm:w-48"
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
          aria-label="Custom task agent"
        >
          {CUSTOM_AGENT_OPTIONS.map((id) => (
            <option key={id} value={id}>
              {getAgentById(id)?.name ?? id}
            </option>
          ))}
        </select>
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a custom demo task…"
          className="h-8 bg-white text-[13px]"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          onClick={addCustom}
          disabled={!note.trim()}
        >
          <Plus className="size-3.5" aria-hidden />
          Add
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-[12px] text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#17212B]/55">
          No follow-up tasks yet. Use Evaluate / Add on a section, or add a
          custom item above.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const agent = getAgentById(task.agentId);
            return (
              <li
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5",
                  task.status === "done"
                    ? "border-[#E5E7EB] opacity-70"
                    : "border-[#DCE3EE]",
                )}
              >
                <button
                  type="button"
                  className="mt-0.5 text-[#2563EB]"
                  onClick={() => onToggle(task.id)}
                  aria-label={
                    task.status === "open" ? "Mark done" : "Reopen task"
                  }
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      "text-[13px] text-[#17212B]",
                      task.status === "done" && "line-through",
                    )}
                  >
                    {task.note}
                  </p>
                  <p className="text-[11px] text-[#17212B]/50">
                    {sectionTitleFor(task.sectionId)} ·{" "}
                    <Link
                      href={agent?.route ?? `/agents/${task.agentId}`}
                      className="text-[#2563EB] hover:underline"
                    >
                      {agent?.name ?? task.agentId}
                    </Link>{" "}
                    · {task.status} ·{" "}
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[#17212B]/40 hover:text-rose-600"
                  onClick={() => onRemove(task.id)}
                  aria-label="Remove task"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
