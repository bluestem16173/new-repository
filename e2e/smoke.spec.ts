import { expect, test } from "@playwright/test";

test.describe("MedIntel smoke", () => {
  test("dashboard loads with disclaimer and demo mode", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("note", {
        name: "Independent demonstration disclaimer",
      }),
    ).toBeVisible();
    await expect(page.getByText("MedIntel").first()).toBeVisible();
    await expect(page.getByText(/Demo mode/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Medical Affairs Overview" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "New Medical Inquiry" }),
    ).toBeVisible();
  });

  test("medical information inquiry list is reachable", async ({ page }) => {
    await page.goto("/medical-information");
    await expect(
      page.getByRole("heading", { name: "Inquiry workspace" }),
    ).toBeVisible();
  });

  test("field medical excellence dashboard and roster navigate", async ({
    page,
  }) => {
    await page.goto("/field-medical");
    await expect(
      page.getByRole("heading", { name: "Field Medical Excellence" }),
    ).toBeVisible();
    await expect(page.getByText(/synthetic demonstration/i).first()).toBeVisible();
    await page.getByRole("link", { name: "Open MSL roster" }).click();
    await expect(
      page.getByRole("heading", { name: "MSL roster", exact: true }),
    ).toBeVisible();
  });
});
