import {
  DEMO_PREVIEW_LABEL,
  STUDIO_ROLES,
  STUDIO_WORKFLOWS,
} from "@/domain/workflow-studio/fixtures";
import type {
  StudioRole,
  WorkflowDefinition,
  WorkflowOrchestrationAdapter,
  WorkflowStudioId,
} from "@/domain/workflow-studio/types";

/**
 * Demo orchestration adapter — reads local fixtures only.
 * Never simulates network calls, fake AI runs, timings, or tokens.
 * Swap implementations later for live orchestration without rewriting the UI.
 */
export class DemoWorkflowOrchestrationAdapter
  implements WorkflowOrchestrationAdapter
{
  listRoles(): StudioRole[] {
    return STUDIO_ROLES;
  }

  listWorkflows(): WorkflowDefinition[] {
    return STUDIO_WORKFLOWS;
  }

  getWorkflow(id: WorkflowStudioId): WorkflowDefinition | null {
    return STUDIO_WORKFLOWS.find((workflow) => workflow.id === id) ?? null;
  }

  getDemoLabel(): string {
    return DEMO_PREVIEW_LABEL;
  }

  supportsLiveExecution(): boolean {
    return false;
  }
}

let activeAdapter: WorkflowOrchestrationAdapter =
  new DemoWorkflowOrchestrationAdapter();

export function getWorkflowOrchestrationAdapter(): WorkflowOrchestrationAdapter {
  return activeAdapter;
}

/** Test / future DI hook — production UI should keep the demo adapter until live wiring. */
export function setWorkflowOrchestrationAdapter(
  adapter: WorkflowOrchestrationAdapter,
): void {
  activeAdapter = adapter;
}

export function resetWorkflowOrchestrationAdapter(): void {
  activeAdapter = new DemoWorkflowOrchestrationAdapter();
}
