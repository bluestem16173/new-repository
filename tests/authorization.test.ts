import { describe, expect, it } from "vitest";
import {
  assertCanApprove,
  canAdvanceWorkflow,
  canApproveInquiry,
  canCreateInquiry,
  isApproverRole,
} from "@/domain/authorization";

describe("authorization rules", () => {
  it("limits approval to medical_reviewer and admin", () => {
    expect(canApproveInquiry("medical_reviewer")).toBe(true);
    expect(canApproveInquiry("admin")).toBe(true);
    expect(canApproveInquiry("medical_information_specialist")).toBe(false);
    expect(canApproveInquiry("msl")).toBe(false);
    expect(canApproveInquiry("field_director")).toBe(false);
    expect(isApproverRole("medical_reviewer")).toBe(true);
  });

  it("throws when a non-approver attempts approval assertion", () => {
    expect(() => assertCanApprove("msl")).toThrow(
      /Only medical_reviewer or admin/,
    );
  });

  it("allows specialists to advance drafting workflow but not approve", () => {
    expect(
      canAdvanceWorkflow(
        "medical_information_specialist",
        "response_drafted",
        "medical_review",
      ),
    ).toBe(true);
    expect(
      canAdvanceWorkflow(
        "medical_information_specialist",
        "medical_review",
        "approved",
      ),
    ).toBe(false);
  });

  it("allows MSL to submit but not approve", () => {
    expect(canCreateInquiry("msl")).toBe(true);
    expect(canAdvanceWorkflow("msl", "draft", "submitted")).toBe(true);
    expect(
      canAdvanceWorkflow("msl", "medical_review", "approved"),
    ).toBe(false);
  });

  it("blocks field_director from MI workflow mutations", () => {
    expect(canCreateInquiry("field_director")).toBe(false);
    expect(
      canAdvanceWorkflow("field_director", "draft", "submitted"),
    ).toBe(false);
  });
});
