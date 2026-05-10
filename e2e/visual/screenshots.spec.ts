import { test, expect } from "@playwright/test";

/**
 * Full-page visual snapshots (Chromium). Update baselines locally:
 *   npx playwright test e2e/visual/screenshots --update-snapshots
 */
test.describe("Full-page screenshots", () => {
  test("default load (guidance or day-focus)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main.main-content")).toBeVisible();
    await expect(page).toHaveScreenshot("app-default.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("workspace selected + guidance (run controls)", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem(
        "platoon-companion-workspace",
        "/demo/workspace-for-screenshot",
      );
    });
    await page.goto("/");
    test.skip(
      !(await page.locator(".guidance-header").isVisible()),
      "Guidance layout only — day-focus replaces checklist when course clone is present.",
    );
    await expect(page).toHaveScreenshot("app-workspace-guidance.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });

  test("no-guidance empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/select course week/i).selectOption("3");
    await page.getByLabel(/select day of the week/i).selectOption("1");
    await expect(page.locator(".no-guidance")).toBeVisible();
    await expect(page).toHaveScreenshot("app-no-guidance.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
