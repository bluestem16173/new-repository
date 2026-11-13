import { describe, expect, it } from "vitest";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  if (value.startsWith("/login") || value.startsWith("/auth")) {
    return "/dashboard";
  }
  return value;
}

describe("post-auth redirect safety", () => {
  it("defaults to dashboard", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
  });

  it("rejects open redirects", () => {
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example")).toBe("/dashboard");
  });

  it("allows internal app paths", () => {
    expect(safeNext("/field-medical")).toBe("/field-medical");
    expect(safeNext("/medical-information/inquiries/new")).toBe(
      "/medical-information/inquiries/new",
    );
  });

  it("blocks auth loops", () => {
    expect(safeNext("/login")).toBe("/dashboard");
    expect(safeNext("/auth/callback")).toBe("/dashboard");
  });
});
