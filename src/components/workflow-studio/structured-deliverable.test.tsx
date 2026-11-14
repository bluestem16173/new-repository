/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StructuredDeliverableView } from "@/components/workflow-studio/structured-deliverable-view";

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

vi.mock("@/app/actions/workflow-studio", () => ({
  createAgentFollowUpTaskAction: vi.fn(async (input: {
    sectionId: string;
    agentId: string;
    note: string;
    workflowId: string;
  }) => ({
    ok: true,
    task: {
      id: "aft-test",
      sectionId: input.sectionId,
      agentId: input.agentId,
      note: input.note,
      status: "open",
      createdAt: new Date().toISOString(),
      workflowId: input.workflowId,
    },
  })),
}));

vi.mock("@/app/actions/data-room", () => ({
  sendToDataRoomAction: vi.fn(async () => ({
    ok: true,
    package: {
      id: "pkg-test",
      title: "Test",
      summary: "Summary",
      workflowType: "kol-meeting-prep",
      sections: [],
      demoLabel: "demo",
      oversightLabel: "oversight",
      senderId: "u1",
      senderEmail: "a@demo.medintel.local",
      senderDisplayName: "A",
      accessEmails: [],
      organizationId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      persistence: "demo_memory",
    },
  })),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("StructuredDeliverableView", () => {
  it("renders agent-linked sections and creates a follow-up task", async () => {
    const user = userEvent.setup();
    render(
      <StructuredDeliverableView
        workflowId="kol-meeting-prep"
        title="KOL Meeting Prep Packet — Aurelia™-X (synthetic)"
        summary="Illustrative briefing packet."
        sections={[
          {
            id: "visit-context",
            title: "Visit Context",
            body: "Dr. Mira Chen visit context (fictional).",
            agentIds: ["medical-drafting", "literature-scout"],
          },
          {
            id: "key-evidence",
            title: "Key Evidence",
            body: "Four allowlisted synthetic passages.",
            agentIds: ["evidence-analyst", "literature-scout"],
          },
        ]}
        sourceLabel="fixture packet"
      />,
    );

    expect(
      screen.getByText(/Illustrative Demo · Human oversight required/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Literature Scout/i })[0],
    ).toHaveAttribute("href", "/agents/literature-scout");
    expect(screen.getByRole("button", { name: /Send to Data Room/i })).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /Evaluate with agent/i })[0]!,
    );

    expect(
      await screen.findByText(/Evaluate “Visit Context”/i),
    ).toBeInTheDocument();
  });
});
