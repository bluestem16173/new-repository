import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
} from "@/domain/workflow";

describe("medical information workflow transitions", () => {
  it("allows the happy-path forward transitions", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
    expect(canTransition("submitted", "evidence_review")).toBe(true);
    expect(canTransition("evidence_review", "response_drafted")).toBe(true);
    expect(canTransition("response_drafted", "medical_review")).toBe(true);
    expect(canTransition("medical_review", "approved")).toBe(true);
    expect(canTransition("approved", "closed")).toBe(true);
  });

  it("allows rejected and needs_revision where defined", () => {
    expect(canTransition("submitted", "rejected")).toBe(true);
    expect(canTransition("medical_review", "needs_revision")).toBe(true);
    expect(canTransition("needs_revision", "response_drafted")).toBe(true);
  });

  it("blocks invalid skips and terminal exits", () => {
    expect(canTransition("draft", "approved")).toBe(false);
    expect(canTransition("closed", "submitted")).toBe(false);
    expect(canTransition("rejected", "approved")).toBe(false);
    expect(() => assertTransition("draft", "approved")).toThrow(
      /Invalid workflow transition/,
    );
  });

  it("marks closed and rejected as terminal", () => {
    expect(isTerminalStatus("closed")).toBe(true);
    expect(isTerminalStatus("rejected")).toBe(true);
    expect(isTerminalStatus("approved")).toBe(false);
  });

  it("returns a copy of allowed transitions", () => {
    const allowed = getAllowedTransitions("draft");
    expect(allowed).toEqual(["submitted"]);
    allowed.push("approved");
    expect(getAllowedTransitions("draft")).toEqual(["submitted"]);
  });
});
