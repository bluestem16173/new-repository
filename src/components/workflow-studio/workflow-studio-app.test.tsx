/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkflowStudioApp } from "@/components/workflow-studio/workflow-studio-app";

vi.mock("next/image", () => ({
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} src={props.src} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/workflow-studio/workflow-canvas", () => ({
  WorkflowCanvas: ({
    workflow,
    selectedNodeId,
    onSelectNode,
  }: {
    workflow: { title: string; nodes: Array<{ id: string }> };
    selectedNodeId: string | null;
    onSelectNode: (id: string | null) => void;
  }) => (
    <div
      role="application"
      aria-label={`${workflow.title} pathway canvas`}
    >
      <button type="button" onClick={() => onSelectNode(workflow.nodes[0]?.id ?? null)}>
        select-first-node
      </button>
      <span data-testid="selected-node">{selectedNodeId ?? "none"}</span>
    </div>
  ),
}));

vi.mock("@/app/actions/workflow-studio", () => ({
  generateWorkflowStudioMockReportAction: vi.fn(),
  createAgentFollowUpTaskAction: vi.fn(async (input: {
    sectionId: string;
    agentId: string;
    note: string;
    workflowId: string;
  }) => ({
    ok: true,
    task: {
      id: `aft-${input.sectionId}`,
      ...input,
      status: "open",
      createdAt: new Date().toISOString(),
    },
  })),
  evaluateWalkthroughSectionAction: vi.fn(async (input: {
    sectionId: string;
    sectionTitle: string;
    agentId: string;
  }) => ({
    ok: true,
    evaluation: {
      sectionId: input.sectionId,
      sectionTitle: input.sectionTitle,
      agentId: input.agentId,
      agentName: input.agentId,
      headline: `Eval ${input.sectionTitle}`,
      findings: ["Demo finding"],
      confidence: "illustrative",
      evidenceNotes: "Demo only",
      source: "fixture_compose",
      evaluatedAt: new Date().toISOString(),
    },
  })),
}));

vi.mock("@/app/actions/data-room", () => ({
  sendToDataRoomAction: vi.fn(),
}));

vi.mock("@/app/actions/data-room-live", () => ({
  startLivePipelineAction: vi.fn(),
  runLivePipelineStageAction: vi.fn(),
  approveLivePipelineStageAction: vi.fn(),
  finalizeLivePipelineAction: vi.fn(),
  getLivePipelineRunAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("WorkflowStudioApp interactions", () => {
  it("opens demo pathway, toggles deliverable, and returns to role dashboard", async () => {
    const user = userEvent.setup();
    render(<WorkflowStudioApp />);

    expect(
      screen.getByRole("heading", { name: "Role dashboard" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Explore Demo Workflow" }),
    );

    expect(
      screen.getByRole("heading", { name: "KOL Meeting Prep" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Demo Preview — No Live Agent Execution"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View deliverable" }));
    expect(
      screen.getByRole("heading", { name: /KOL Meeting Prep Packet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Illustrative Demo · Human oversight required/i)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Send to Data Room/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Evaluate with agent/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Start live session/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /2\. Evidence Analyst/i }));
    expect(screen.getByText(/Retrieve allowlisted passages/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Role dashboard/i }));
    expect(
      screen.getByRole("heading", { name: "Role dashboard" }),
    ).toBeInTheDocument();
  });
});
