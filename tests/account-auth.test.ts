import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ signUp: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), getCookie: vi.fn(), deleteCookie: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn(async () => ({ auth: mock })) }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: mock.getCookie, delete: mock.deleteCookie })) }));
import { registerAccountAction, requestPasswordResetAction, updatePasswordAction } from "@/app/actions/account";
import { issueRecoveryMarker } from "@/lib/auth/recovery";
import { registrationSchema } from "@/lib/auth/validation";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
const valid = { fullName: "New Member", email: "new@example.invalid", password: "long-password-123!", confirmPassword: "long-password-123!" };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://medintel.example"); mock.signUp.mockResolvedValue({ data: { session: null }, error: null }); });
afterEach(() => vi.unstubAllEnvs());
describe("account registration and recovery", () => {
  it("validates password length and confirmation", () => {
    expect(registrationSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, confirmPassword: "different" }).success).toBe(false);
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });
  it("registers with full name only, no organization or role, then waits for confirmation", async () => {
    const result = await registerAccountAction(valid);
    expect(result.ok).toBe(true);
    expect(result).not.toHaveProperty("destination");
    expect(mock.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ data: { full_name: "New Member" }, emailRedirectTo: "https://medintel.example/auth/callback?flow=registration&next=/onboarding" }) }));
  });
  it("returns the same neutral message for duplicate email", async () => {
    const initial = await registerAccountAction({ ...valid, email: "duplicate@example.invalid" });
    mock.signUp.mockResolvedValueOnce({ data: {}, error: { code: "user_already_exists" } });
    expect(await registerAccountAction({ ...valid, email: "duplicate@example.invalid" })).toEqual(initial);
  });
  it("routes immediate sessions to pending-access onboarding", async () => {
    mock.signUp.mockResolvedValueOnce({ data: { session: { user: { id: "new" } } }, error: null });
    expect(await registerAccountAction({ ...valid, email: "ready@example.invalid" })).toMatchObject({ ok: true, destination: "/onboarding" });
  });
  it("requests a recovery code for an explicit approved callback and hides unknown emails", async () => {
    mock.resetPasswordForEmail.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { code: "user_not_found" } });
    const known = await requestPasswordResetAction("known@example.invalid");
    const unknown = await requestPasswordResetAction("unknown@example.invalid");
    expect(known).toEqual(unknown);
    expect(mock.resetPasswordForEmail).toHaveBeenCalledWith("known@example.invalid", expect.objectContaining({ redirectTo: "https://medintel.example/auth/callback?flow=recovery&next=/reset-password" }));
  });
  it("shows rate-limit feedback", async () => {
    mock.resetPasswordForEmail.mockResolvedValue({ error: { status: 429 } });
    expect(await requestPasswordResetAction("limit@example.invalid")).toMatchObject({ ok: false, error: expect.stringMatching(/Too many/) });
    for (let i = 0; i < 5; i++) expect(allowAuthAttempt("test", "limit@example.invalid", 100)).toBe(true);
    expect(allowAuthAttempt("test", "limit@example.invalid", 101)).toBe(false);
    expect(allowAuthAttempt("test", "limit@example.invalid", 1_000_000)).toBe(true);
  });
  it("explains provider email limits without promising a reset time", async () => {
    mock.resetPasswordForEmail.mockResolvedValue({ error: { status: 429, code: "over_email_send_rate_limit" } });
    expect(await requestPasswordResetAction("email-limit@example.invalid")).toMatchObject({ ok: false, error: expect.stringContaining("Email sending is temporarily rate-limited") });
  });
  it("rejects missing recovery authorization before updating passwords", async () => {
    mock.getCookie.mockReturnValue(undefined);
    expect((await updatePasswordAction(valid)).ok).toBe(false);
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("rejects recovery markers belonging to a different session", async () => {
    mock.getCookie.mockReturnValue({ value: issueRecoveryMarker("original") });
    mock.getUser.mockResolvedValue({ data: { user: { id: "different" } } });
    expect((await updatePasswordAction(valid)).ok).toBe(false);
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("updates only a verified recovery session and revokes sessions after success", async () => {
    mock.getCookie.mockReturnValue({ value: issueRecoveryMarker("recovering-user") });
    mock.getUser.mockResolvedValue({ data: { user: { id: "recovering-user" } } });
    mock.updateUser.mockResolvedValue({ error: null }); mock.signOut.mockResolvedValue({ error: null });
    expect(await updatePasswordAction(valid)).toMatchObject({ ok: true, message: "Password updated. Sign in with your new password." });
    expect(mock.updateUser).toHaveBeenCalledWith({ password: valid.password });
    expect(mock.deleteCookie).toHaveBeenCalledWith("medintel-recovery");
    expect(mock.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
