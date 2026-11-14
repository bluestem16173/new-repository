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

    await user.click(screen.getByRole("button", { name: /2\. Evidence Analyst/i }));
    expect(screen.getByText(/Retrieve allowlisted passages/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Role dashboard/i }));
    expect(
      screen.getByRole("heading", { name: "Role dashboard" }),
    ).toBeInTheDocument();
  });
});
