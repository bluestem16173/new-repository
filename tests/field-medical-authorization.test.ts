import { describe, expect, it } from "vitest";
import {
  assertCanApproveReadiness,
  assertCanMutateCoaching,
  assertNotSelfApproval,
  canApproveReadiness,
  canMutateCoaching,
} from "@/domain/field-medical/authorization";

describe("field medical authorization", () => {
  it("allows leaders to approve readiness and blocks specialists/MSLs", () => {
    expect(canApproveReadiness("admin")).toBe(true);
    expect(canApproveReadiness("field_director")).toBe(true);
    expect(canApproveReadiness("medical_reviewer")).toBe(true);
    expect(canApproveReadiness("msl")).toBe(false);
    expect(canApproveReadiness("medical_information_specialist")).toBe(false);
    expect(() => assertCanApproveReadiness("msl")).toThrow(/approve readiness/);
  });

  it("restricts coaching mutations to admin and field directors", () => {
    expect(canMutateCoaching("field_director")).toBe(true);
    expect(canMutateCoaching("medical_reviewer")).toBe(false);
    expect(() => assertCanMutateCoaching("msl")).toThrow(/mutate coaching/);
  });

  it("blocks MSL self-approval when profile ids match", () => {
    expect(() =>
      assertNotSelfApproval({
        actorProfileId: "same-id",
        mslProfileId: "same-id",
      }),
    ).toThrow(/self-approve/);
  });
});
