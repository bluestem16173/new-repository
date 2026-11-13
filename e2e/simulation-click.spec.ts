import { expect, test } from "@playwright/test";

test("start simulation button creates a transcript", async ({ page }) => {
  page.on("pageerror", (err) => {
    throw err;
  });

  await page.goto(
    "/field-medical/simulations/si-scen-0001-1111-4111-8111-111111111111",
  );

  const start = page.getByRole("button", { name: "Start simulation" });
  await expect(start).toBeVisible();
  await expect(start).toBeEnabled();
  await start.click();

  await expect(
    page.getByRole("list", { name: "Simulation transcript" }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/fictional cardiologist/i).first()).toBeVisible();
});
