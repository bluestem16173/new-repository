import { describe, expect, it } from "vitest";
import { parseLegacyRecoveryFragment } from "@/lib/auth/legacy-recovery";
describe("legacy recovery fragment handling", () => {
  it("recognizes recovery fragments without accepting external destinations", () => {
    expect(parseLegacyRecoveryFragment("#access_token=fixture-access&refresh_token=fixture-refresh&type=recovery&next=//evil.example")).toEqual({ accessToken: "fixture-access", refreshToken: "fixture-refresh" });
  });
  it("rejects missing tokens, duplicate parameters and unrelated fragments", () => {
    for (const hash of ["", "#section", "#type=recovery&access_token=a", "#type=signup&access_token=a&refresh_token=b", "#type=recovery&access_token=a&access_token=b&refresh_token=c", "#type=recovery&type=recovery&access_token=a&refresh_token=b"]) expect(parseLegacyRecoveryFragment(hash)).toBeNull();
  });
});
