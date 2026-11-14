import { expect, test } from "@playwright/test";

test("registration validates password mismatch and exposes no organization choice", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Fictional New Member");
  await page.getByLabel("Email address").fill("new@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("a-long-password-123");
  await page.getByLabel("Confirm password", { exact: true }).fill("different-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Passwords do not match.");
  await expect(page.getByRole("combobox")).toHaveCount(0);
});
test("forgot-password and missing recovery link show actionable states", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password", exact: true }).click();
  await expect(page).toHaveURL(/forgot-password/);
  await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Sign In" })).toBeVisible();
  await page.goto("/reset-password");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("missing, expired, invalid, or already used");
  await expect(page.getByRole("link", { name: "Request another reset link" })).toBeVisible();
});

test("legacy recovery fragments leave login and remove credentials from the URL", async ({ page }) => {
  await page.goto("/login#access_token=fixture-access&refresh_token=fixture-refresh&type=recovery");
  await expect(page).toHaveURL(/reset-password/);
  await expect(page).not.toHaveURL(/access_token|refresh_token/);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("missing, expired, invalid, or already used");
});
test("password changes require a signed-in session", async ({ page }) => {
  await page.goto("/change-password");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("unavailable until authentication is configured");
});
