import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams("notice=password_updated") }));
vi.mock("@/app/actions/account", () => ({ signInWithPasswordAction: vi.fn() }));
vi.mock("@/app/actions/auth", () => ({ requestMagicLinkAction: vi.fn() }));
import { LoginForm } from "@/components/auth/login-form";
describe("password update confirmation", () => {
  it("keeps success feedback on the sign-in page after the recovery session is cleared", () => {
    const html = renderToStaticMarkup(createElement(LoginForm));
    expect(html).toContain("Password updated. Sign in with your new password.");
    expect(html).toContain('role="status"');
    expect(html).toContain('type="password"');
  });
});
