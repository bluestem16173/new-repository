/**
 * Visual Workflow Studio — frontend-only types.
 * Illustrative Demo Data; no live agent execution.
 */

export type StudioRoleId =
  | "msl"
  | "ma_manager"
  | "mi_specialist"
  | "leadership";

export type WorkflowStudioId =
  | "kol-meeting-prep"
  | "manager-education"
  | "mi-inquiry"
  | "leadership-briefing";

export type NodeRunStatus =
  | "ready"
  | "in_review"
  | "complete"
  | "blocked"
  | "pending";

export type ValidationState = "pass" | "warn" | "fail" | "not_run";

export interface StudioRole {
  id: StudioRoleId;
  label: string;
  shortLabel: string;
  description: string;
  objectivePrompt: string;
  actions: StudioRoleAction[];
  defaultWorkflowId: WorkflowStudioId;
}

export interface StudioRoleAction {
  id: string;
  label: string;
  description: string;
  workflowId: WorkflowStudioId;
}

export interface WorkflowNodeFixture {
  id: string;
  agentId: string;
  task: string;
  status: NodeRunStatus;
  inputSummary: string;
  outputSummary: string;
  validation: ValidationState;
  validationNotes: string;
  /** Desktop horizontal layout */
  position: { x: number; y: number };
  /** Mobile vertical layout */
  mobilePosition: { x: number; y: number };
}

export interface WorkflowEdgeFixture {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowDeliverable {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  disclaimer: string;
}

export interface WorkflowDefinition {
  id: WorkflowStudioId;
  title: string;
  roleId: StudioRoleId;
  objective: string;
  audience: string;
  productContext: string;
  nodes: WorkflowNodeFixture[];
  edges: WorkflowEdgeFixture[];
  deliverable: WorkflowDeliverable;
}

export interface WorkflowStudioSnapshot {
  roles: StudioRole[];
  workflows: WorkflowDefinition[];
  demoLabel: string;
}

/** Future orchestration boundary — UI depends on this, not on mock backends. */
export interface WorkflowOrchestrationAdapter {
  listRoles(): StudioRole[];
  listWorkflows(): WorkflowDefinition[];
  getWorkflow(id: WorkflowStudioId): WorkflowDefinition | null;
  getDemoLabel(): string;
  /** Reserved for live orchestration; demo adapter never executes agents. */
  supportsLiveExecution(): boolean;
}
