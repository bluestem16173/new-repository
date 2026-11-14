"use client";

import { useState } from "react";
import {
  ArrowLeft,
  GitBranchPlus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getAgentById } from "@/domain/agents/registry";
import { getWorkflowOrchestrationAdapter } from "@/domain/workflow-studio/adapter";
import type {
  StudioRoleId,
  WorkflowStudioId,
} from "@/domain/workflow-studio/types";
import { Button } from "@/components/ui/button";
import { DetailsPanel } from "@/components/workflow-studio/details-panel";
import { DeliverablePanel } from "@/components/workflow-studio/deliverable-panel";
import { WorkflowCanvas } from "@/components/workflow-studio/workflow-canvas";
import { cn } from "@/lib/utils";

type StudioView = "roles" | "canvas";

export function WorkflowStudioApp() {
  const adapter = getWorkflowOrchestrationAdapter();
  const roles = adapter.listRoles();
  const workflows = adapter.listWorkflows();
  const demoLabel = adapter.getDemoLabel();

  const [view, setView] = useState<StudioView>("roles");
  const [roleId, setRoleId] = useState<StudioRoleId>("msl");
  const [workflowId, setWorkflowId] = useState<WorkflowStudioId>(
    "kol-meeting-prep",
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeliverable, setShowDeliverable] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const selectedRole = roles.find((role) => role.id === roleId) ?? roles[0];
  const workflow = adapter.getWorkflow(workflowId);

  const selectedNode =
    workflow?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedAgent = selectedNode
    ? getAgentById(selectedNode.agentId)
    : null;

  function openWorkflow(nextWorkflowId: WorkflowStudioId, nextRole?: StudioRoleId) {
    if (nextRole) setRoleId(nextRole);
    setWorkflowId(nextWorkflowId);
    setSelectedNodeId(null);
    setShowDeliverable(false);
    setDemoStep(0);
    setView("canvas");
  }

  function restartDemo() {
    setSelectedNodeId(null);
    setShowDeliverable(false);
    setDemoStep(0);
    setView("roles");
    setRoleId("msl");
    setWorkflowId("kol-meeting-prep");
  }

  function exploreDemoWorkflow() {
    const demoWorkflow = adapter.getWorkflow("kol-meeting-prep");
    if (!demoWorkflow) return;
    setRoleId("msl");
    setWorkflowId("kol-meeting-prep");
    setSelectedNodeId(demoWorkflow.nodes[0]?.id ?? null);
    setShowDeliverable(false);
    setDemoStep(1);
    setView("canvas");
  }

  function advanceDemo() {
    if (!workflow) return;
    if (demoStep === 0) {
      exploreDemoWorkflow();
      return;
    }
    if (demoStep < workflow.nodes.length) {
      const next = workflow.nodes[demoStep];
      setSelectedNodeId(next.id);
      setShowDeliverable(false);
      setDemoStep(demoStep + 1);
      return;
    }
    if (!showDeliverable) {
      setShowDeliverable(true);
      setDemoStep(workflow.nodes.length + 1);
      return;
    }
    restartDemo();
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 bg-white px-1 py-2">
      <header className="space-y-3 border-b border-[#E5E7EB] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#2563EB]">
              MedIntel Workflow Studio
            </p>
            <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
              Visual Workflow Studio
            </h2>
            <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
              Choose an objective by role. MedIntel maps the pathway across the
              sixteen-agent portfolio — you inspect the connected agents,
              validation, and illustrative deliverable. Frontend prototype with
              Illustrative Demo Data only.
            </p>
          </div>
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-950"
            role="status"
          >
            {demoLabel}
          </div>
        </div>
        <p className="text-[13px] text-[#17212B]/55">
          Role selection is a UI preference only and does not change
          authorization. Live execution is disabled — no API keys required.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          onClick={exploreDemoWorkflow}
        >
          <Sparkles className="size-4" aria-hidden />
          Explore Demo Workflow
        </Button>
        {view === "canvas" ? (
          <>
            <Button type="button" variant="outline" onClick={advanceDemo}>
              {showDeliverable
                ? "Restart demo"
                : demoStep === 0
                  ? "Start guided tour"
                  : demoStep < (workflow?.nodes.length ?? 0)
                    ? "Next agent"
                    : "Show deliverable"}
            </Button>
            <Button type="button" variant="outline" onClick={restartDemo}>
              <RotateCcw className="size-4" aria-hidden />
              Restart
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setView("roles")}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Role dashboard
            </Button>
          </>
        ) : null}
      </div>

      {view === "roles" ? (
        <section aria-labelledby="role-dashboard-heading" className="space-y-5">
          <div>
            <h3
              id="role-dashboard-heading"
              className="text-[18px] font-semibold text-[#17212B]"
            >
              Role dashboard
            </h3>
            <p className="mt-1 text-[14px] text-[#17212B]/65">
              Four guided categories. Pick an action to open its pathway canvas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => {
              const active = role.id === roleId;
              return (
                <article
                  key={role.id}
                  className={cn(
                    "rounded-xl border p-5 transition-colors",
                    active
                      ? "border-[#2563EB]/40 bg-[#F8FAFF]"
                      : "border-[#E5E7EB] bg-white",
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setRoleId(role.id)}
                    aria-pressed={active}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]">
                      {role.shortLabel}
                    </p>
                    <h4 className="mt-1 text-[16px] font-semibold text-[#17212B]">
                      {role.label}
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#17212B]/70">
                      {role.description}
                    </p>
                    <p className="mt-3 text-[13px] italic text-[#17212B]/55">
                      {role.objectivePrompt}
                    </p>
                  </button>
                  <ul className="mt-4 space-y-2">
                    {role.actions.map((action) => (
                      <li key={action.id}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto w-full justify-start whitespace-normal border-[#E5E7EB] px-3 py-2 text-left"
                          onClick={() =>
                            openWorkflow(action.workflowId, role.id)
                          }
                        >
                          <GitBranchPlus
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden
                          />
                          <span>
                            <span className="block text-[13px] font-medium text-[#17212B]">
                              {action.label}
                            </span>
                            <span className="mt-0.5 block text-[12px] font-normal text-[#17212B]/65">
                              {action.description}
                            </span>
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
            <h4 className="text-[14px] font-semibold text-[#17212B]">
              All pathways
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {workflows.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#E5E7EB]"
                  onClick={() => openWorkflow(item.id, item.roleId)}
                >
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {view === "canvas" && workflow ? (
        <section aria-labelledby="canvas-heading" className="space-y-4">
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#17212B]/45">
              {selectedRole.shortLabel} pathway
            </p>
            <h3
              id="canvas-heading"
              className="text-[18px] font-semibold text-[#17212B]"
            >
              {workflow.title}
            </h3>
            <p className="max-w-3xl text-[14px] leading-relaxed text-[#17212B]/70">
              {workflow.objective}
            </p>
            <p className="text-[13px] text-[#17212B]/55">
              Audience: {workflow.audience}. Context: {workflow.productContext}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <WorkflowCanvas
              key={`${workflow.id}-${demoStep === 0 ? "idle" : "demo"}`}
              workflow={workflow}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                if (id) setDemoStep(Math.max(demoStep, 1));
              }}
            />
            <DetailsPanel
              node={selectedNode}
              agent={selectedAgent}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={showDeliverable ? "secondary" : "outline"}
              onClick={() => setShowDeliverable((value) => !value)}
            >
              {showDeliverable ? "Hide deliverable" : "View deliverable"}
            </Button>
            {workflow.nodes.map((node, index) => {
              const agent = getAgentById(node.agentId);
              return (
                <Button
                  key={node.id}
                  type="button"
                  size="sm"
                  variant={selectedNodeId === node.id ? "default" : "ghost"}
                  onClick={() => setSelectedNodeId(node.id)}
                  aria-current={selectedNodeId === node.id ? "true" : undefined}
                >
                  {index + 1}. {agent?.name ?? node.agentId}
                </Button>
              );
            })}
          </div>

          <DeliverablePanel
            deliverable={workflow.deliverable}
            open={showDeliverable}
          />
        </section>
      ) : null}
    </div>
  );
}
