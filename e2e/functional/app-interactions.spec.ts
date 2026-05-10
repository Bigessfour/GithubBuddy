import { test, expect } from "@playwright/test";

/**
 * Lightweight **behavior** checks for the Vite web app (not screenshot baselines).
 * Complements `e2e/visual/inventory.spec.ts`, which asserts presence of many controls.
 */
test.describe("App interactions (browser)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("githubbuddy-intro-dismissed-v1", "1");
    });
  });

  test("header day badge tracks week and day selectors", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".current-day-badge")).toHaveText("Week 2 Day 4");
    await page.getByLabel(/select course week/i).selectOption("3");
    await page.getByLabel(/select day of the week/i).selectOption("1");
    await expect(page.locator(".current-day-badge")).toHaveText("Week 3 Day 1");
  });

  test("week 3 day 1 shows no-guidance empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/select course week/i).selectOption("3");
    await page.getByLabel(/select day of the week/i).selectOption("1");
    await expect(page.locator(".no-guidance")).toBeVisible();
    await expect(
      page.getByText(/no guidance available for week/i),
    ).toBeVisible();
  });

  test("first checklist step checkbox toggles when guidance layout is active", async ({
    page,
  }) => {
    await page.goto("/");
    test.skip(
      !(await page.locator(".guidance-header").isVisible()),
      "Day-focus or empty layout — checklist steps are guidance-only",
    );
    const checkbox = page
      .locator(".step-card")
      .first()
      .getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });
});

test.describe("First-run process intro", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("githubbuddy-intro-dismissed-v1");
    });
  });

  test("shows dialog until Got it", async ({ page }) => {
    await page.goto("/");
    const dialog = page.getByRole("dialog", {
      name: /how platoon companion works/i,
    });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: /^got it$/i }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /how this works/i }),
    ).toBeVisible();
  });
});
