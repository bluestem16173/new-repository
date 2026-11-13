import { describe, expect, it } from "vitest";
import { inquiryIntakeSchema } from "@/domain/schemas";

describe("inquiry intake validation", () => {
  const valid = {
    title: "Dosing question for fictional product",
    questionText:
      "What is the labeled dosing guidance for adults with mild renal impairment?",
    productName: "AtheraLyn (fictional)",
    therapeuticArea: "Cardiovascular",
    requesterType: "hcp" as const,
    requesterName: "Dr. Demo User",
    requesterOrganization: "Synthetic Clinic",
    channel: "email" as const,
    priority: "medium" as const,
    submitImmediately: false,
  };

  it("accepts a well-formed synthetic inquiry", () => {
    const parsed = inquiryIntakeSchema.parse(valid);
    expect(parsed.title).toContain("Dosing");
    expect(parsed.submitImmediately).toBe(false);
  });

  it("rejects titles that are too short", () => {
    const result = inquiryIntakeSchema.safeParse({
      ...valid,
      title: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects question text that is too short", () => {
    const result = inquiryIntakeSchema.safeParse({
      ...valid,
      questionText: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid requester types", () => {
    const result = inquiryIntakeSchema.safeParse({
      ...valid,
      requesterType: "unknown",
    });
    expect(result.success).toBe(false);
  });
});
