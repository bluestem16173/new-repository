import { afterEach, describe, expect, it } from "vitest";
import { getAgentById, listAgents } from "@/domain/agents/registry";
import {
  DemoWorkflowOrchestrationAdapter,
  getWorkflowOrchestrationAdapter,
  resetWorkflowOrchestrationAdapter,
  setWorkflowOrchestrationAdapter,
} from "@/domain/workflow-studio/adapter";
import {
  DEMO_PREVIEW_LABEL,
  STUDIO_ROLES,
  STUDIO_WORKFLOWS,
} from "@/domain/workflow-studio/fixtures";
import type {
  WorkflowOrchestrationAdapter,
  WorkflowStudioId,
} from "@/domain/workflow-studio/types";

describe("Visual Workflow Studio fixtures", () => {
  it("exposes four roles and four workflows", () => {
    expect(STUDIO_ROLES).toHaveLength(4);
    expect(STUDIO_WORKFLOWS).toHaveLength(4);
    expect(STUDIO_ROLES.map((role) => role.id).sort()).toEqual([
      "leadership",
      "ma_manager",
      "mi_specialist",
      "msl",
    ]);
    expect(STUDIO_WORKFLOWS.map((workflow) => workflow.id).sort()).toEqual([
      "kol-meeting-prep",
      "leadership-briefing",
      "manager-education",
      "mi-inquiry",
    ]);
  });

  it("references only registered agent ids and keeps pathways connected", () => {
    const agentIds = new Set(listAgents().map((agent) => agent.id));

    for (const workflow of STUDIO_WORKFLOWS) {
      expect(workflow.nodes.length).toBeGreaterThanOrEqual(3);
      expect(workflow.edges.length).toBeGreaterThanOrEqual(2);
      expect(workflow.deliverable.sections.length).toBeGreaterThan(0);
      expect(workflow.deliverable.disclaimer.toLowerCase()).toContain(
        "illustrative",
      );

      const nodeIds = new Set(workflow.nodes.map((node) => node.id));
      for (const node of workflow.nodes) {
        expect(agentIds.has(node.agentId)).toBe(true);
        expect(getAgentById(node.agentId)).not.toBeNull();
        expect(node.task.length).toBeGreaterThan(8);
        expect(node.inputSummary.length).toBeGreaterThan(0);
        expect(node.outputSummary.length).toBeGreaterThan(0);
        expect(node.position).toBeTruthy();
        expect(node.mobilePosition).toBeTruthy();
      }
      for (const edge of workflow.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    }
  });

  it("labels demo preview and uses fictional product context without live execution claims", () => {
    expect(DEMO_PREVIEW_LABEL).toContain("No Live Agent Execution");
    for (const workflow of STUDIO_WORKFLOWS) {
      expect(workflow.productContext.toLowerCase()).toMatch(/fictional|synthetic/);
      expect(workflow.deliverable.summary.toLowerCase()).not.toContain(
        "token usage",
      );
    }
  });
});

describe("Workflow orchestration adapter", () => {
  afterEach(() => {
    resetWorkflowOrchestrationAdapter();
  });

  it("demo adapter never claims live execution and resolves workflows", () => {
    const adapter = new DemoWorkflowOrchestrationAdapter();
    expect(adapter.supportsLiveExecution()).toBe(false);
    expect(adapter.getDemoLabel()).toBe(DEMO_PREVIEW_LABEL);
    expect(adapter.listRoles()).toHaveLength(4);
    expect(adapter.getWorkflow("mi-inquiry")?.title).toBe("MI Inquiry");
    expect(adapter.getWorkflow("missing" as WorkflowStudioId)).toBeNull();
  });

  it("allows swapping adapters without touching the agent registry", () => {
    const stub: WorkflowOrchestrationAdapter = {
      listRoles: () => [],
      listWorkflows: () => [],
      getWorkflow: () => null,
      getDemoLabel: () => "stub",
      supportsLiveExecution: () => false,
    };
    setWorkflowOrchestrationAdapter(stub);
    expect(getWorkflowOrchestrationAdapter().getDemoLabel()).toBe("stub");
    expect(listAgents()).toHaveLength(16);
  });
});
