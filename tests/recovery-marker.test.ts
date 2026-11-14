import { describe, expect, it } from "vitest";
import { issueRecoveryMarker, readRecoveryMarker } from "@/lib/auth/recovery";
describe("recovery authorization marker", () => {
  it("binds the user and enforces expiration", () => {
    const marker = issueRecoveryMarker("user-1", 100);
    expect(readRecoveryMarker(marker, 101)).toBe("user-1");
    expect(readRecoveryMarker(marker, 600101)).toBeNull();
  });
  it("rejects unsigned and tampered markers", () => {
    expect(readRecoveryMarker("user-1")).toBeNull();
    const marker = issueRecoveryMarker("user-1");
    const [payload, signature] = marker.split(".");
    expect(readRecoveryMarker(`${payload}.${signature.slice(0, -2)}aa`)).toBeNull();
    expect(readRecoveryMarker(undefined)).toBeNull();
  });
});
