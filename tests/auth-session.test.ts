import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ user: null as null | { id: string }, membership: false, profile: false, marker: undefined as string | undefined, resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), signInWithPassword: vi.fn(), exchange: vi.fn(), verifyOtp: vi.fn(), signOut: vi.fn(), getAll: vi.fn(), deleteCookie: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn((_url, _key, options) => ({
  auth: {
    getUser: vi.fn(async () => { options.cookies.setAll([{ name: "session", value: "refreshed", options: { httpOnly: true } }]); return { data: { user: state.user } }; }),
    exchangeCodeForSession: async (code: string) => {
      const result = await state.exchange(code);
      if (!result.error && result.data.user) {
        state.user = result.data.user;
        options.cookies.setAll([{ name: "session", value: "recovery-session", options: { httpOnly: true } }]);
      }
      return result;
    },
    resetPasswordForEmail: state.resetPasswordForEmail,
    updateUser: state.updateUser,
    signInWithPassword: state.signInWithPassword,
    verifyOtp: state.verifyOtp,
    signOut: state.signOut,
  },
  from: (table: string) => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: table === "profiles" ? (state.profile ? { organization_id: "org-1" } : null) : (state.membership ? { id: "membership-1" } : null) }) };
    return query;
  },
})) }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn(), get: () => state.marker ? { value: state.marker } : undefined, delete: state.deleteCookie })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
vi.mock("@/lib/security/audit", () => ({ recordSecurityAuditEvent: vi.fn() }));
import { readRecoveryMarker } from "@/lib/auth/recovery";
import { requestPasswordResetAction, updatePasswordAction, signInWithPasswordAction } from "@/app/actions/account";
import { GET } from "@/app/auth/callback/route";
import { proxy } from "@/proxy";
import { signOutAction } from "@/app/actions/auth";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  state.marker = undefined;
  state.user = null; state.profile = false; state.membership = false;
  state.exchange.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
  state.verifyOtp.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://medintel.example");
  state.resetPasswordForEmail.mockResolvedValue({ error: null });
  state.updateUser.mockResolvedValue({ error: null });
  state.signOut.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe("auth callback and session enforcement", () => {
  it("exchanges a recovery code and binds an HttpOnly short-lived marker to the user", async () => {
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?code=one-use&flow=recovery&next=//evil.example"));
    expect(state.exchange).toHaveBeenCalledWith("one-use");
    expect(response.headers.get("location")).toBe("https://medintel.example/reset-password");
    expect(response.cookies.get("medintel-recovery")).toMatchObject({ httpOnly: true, maxAge: 600 });
    expect(response.headers.get("location")).not.toContain("one-use");
  });
  it("verifies token-hash recovery templates without a PKCE browser verifier", async () => {
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?token_hash=private-hash&type=recovery"));
    expect(state.verifyOtp).toHaveBeenCalledWith({ token_hash: "private-hash", type: "recovery" });
    expect(state.exchange).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://medintel.example/reset-password");
    expect(readRecoveryMarker(response.cookies.get("medintel-recovery")?.value)).toBe("recovery-user");
    expect(response.headers.get("location")).not.toContain("private-hash");
  });
  it("allows recovery routes without organization membership", async () => {
    for (const path of ["/forgot-password", "/auth/callback?flow=recovery&code=test", "/reset-password"]) {
      const response = await proxy(new NextRequest(`https://medintel.example${path}`));
      expect(response.headers.get("location")).toBeNull();
    }
  });
  it("does not authorize expired or reused recovery codes", async () => {
    state.exchange.mockResolvedValue({ data: { user: null }, error: { message: "secret-provider-detail" } });
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?code=expired&flow=recovery"));
    expect(response.cookies.get("medintel-recovery")).toBeUndefined();
    expect(response.headers.get("location")).toContain("invalid_or_expired_link");
    expect(response.headers.get("location")).not.toContain("secret-provider-detail");
  });
  it("rejects missing codes", async () => {
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?flow=recovery"));
    expect(response.headers.get("location")).toContain("missing_code");
    expect(state.exchange).not.toHaveBeenCalled();
  });
  it("keeps sign-in callback destinations on origin", async () => {
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?code=valid&next=//evil.example"));
    expect(response.headers.get("location")).toBe("https://medintel.example/dashboard");
    expect(response.cookies.get("medintel-recovery")).toBeUndefined();
  });
  it("redirects anonymous protected requests to sign in", async () => {
    const response = await proxy(new NextRequest("https://medintel.example/dashboard"));
    expect(response.headers.get("location")).toContain("/login");
  });
  it("redirects authenticated nonmembers to onboarding and preserves refreshed cookies", async () => {
    state.user = { id: "pending-user" };
    const response = await proxy(new NextRequest("https://medintel.example/dashboard"));
    expect(response.headers.get("location")).toBe("https://medintel.example/onboarding");
    expect(response.cookies.get("session")?.value).toBe("refreshed");
  });
  it("rejects profiles that do not have a matching membership", async () => {
    state.user = { id: "user-1" }; state.profile = true;
    const response = await proxy(new NextRequest("https://medintel.example/knowledge"));
    expect(response.headers.get("location")).toContain("/onboarding");
  });
  it("allows verified members and carries session refresh cookies", async () => {
    state.user = { id: "user-1" }; state.profile = true; state.membership = true;
    const response = await proxy(new NextRequest("https://medintel.example/dashboard"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("session")?.value).toBe("refreshed");
  });
  it("runs request → PKCE callback → authorized update → sign-in using mocked Supabase", async () => {
    const requested = await requestPasswordResetAction("flow@example.invalid");
    expect(requested.ok).toBe(true);
    const response = await GET(new NextRequest("https://medintel.example/auth/callback?code=valid-code&flow=recovery"));
    expect(response.headers.get("location")).toBe("https://medintel.example/reset-password");
    expect(response.cookies.get("session")?.value).toBe("recovery-session");
    state.marker = response.cookies.get("medintel-recovery")?.value;
    const updated = await updatePasswordAction({ password: "new-secure-password", confirmPassword: "new-secure-password" });
    expect(updated).toMatchObject({ ok: true, destination: "/login?notice=password_updated", message: "Password updated. Sign in with your new password." });
    expect(state.updateUser).toHaveBeenCalledWith({ password: "new-secure-password" });
    expect(state.signOut).toHaveBeenCalledWith({ scope: "global" });
    state.signInWithPassword.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { code: "invalid_credentials" } });
    expect((await signInWithPasswordAction("flow@example.invalid", "new-secure-password", "/dashboard")).ok).toBe(true);
    expect((await signInWithPasswordAction("flow@example.invalid", "old-password", "/dashboard")).ok).toBe(false);
    // Provider success/failure is mocked: actual credential replacement still needs live acceptance testing.
  });
  it("clears recovery authorization on sign-out", async () => {
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/login");
    expect(state.signOut).toHaveBeenCalled();
    expect(state.deleteCookie).toHaveBeenCalledWith("medintel-recovery");
  });
});
