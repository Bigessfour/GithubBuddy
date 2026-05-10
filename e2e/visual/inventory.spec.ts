import { test, expect, type Page } from "@playwright/test";
import {
  shellInventory,
  guidanceInventory,
  guidanceWithWorkspaceInventory,
  dayFocusInventory,
  noGuidanceInventory,
  totalInventoryEntries,
  INVENTORY_VERSION,
  type VisualInventoryItem,
} from "./user-facing-inventory";

async function assertInventory(
  page: Page,
  items: VisualInventoryItem[],
): Promise<void> {
  for (const item of items) {
    if (!(await item.appliesWhen(page))) {
      continue;
    }
    const loc = item.locator(page);
    if (item.expectAttachedOnly) {
      await expect(loc, `[${item.id}] ${item.description}`).toBeAttached();
    } else {
      await expect(loc, `[${item.id}] ${item.description}`).toBeVisible();
    }
  }
}

test.describe("Visual inventory (presence)", () => {
  test("inventory manifest is stable", () => {
    expect(INVENTORY_VERSION).toBe(1);
    expect(totalInventoryEntries()).toBeGreaterThanOrEqual(55);
  });

  test("shell: fixed chrome is always visible on /", async ({ page }) => {
    await page.goto("/");
    await assertInventory(page, shellInventory);
  });

  test("main: exactly one of day-focus, guidance, or no-guidance", async ({
    page,
  }) => {
    await page.goto("/");
    const dayFocus = page.locator(".day-focus");
    const guidance = page.locator(".guidance-header");
    const empty = page.locator(".no-guidance");
    const vis = [
      await dayFocus.isVisible(),
      await guidance.isVisible(),
      await empty.isVisible(),
    ].filter(Boolean).length;
    expect(vis, "Expected exactly one primary main layout").toBe(1);
  });

  test("guidance path: checklist chrome and seven steps", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.locator(".guidance-header").isVisible()),
      "Course clone present — day-focus replaces guidance in this environment",
    );
    await assertInventory(page, guidanceInventory);
    await expect(page.locator(".step-card")).toHaveCount(7);
  });

  test("day-focus path: materials chrome when clone drives UI", async ({
    page,
  }) => {
    await page.goto("/");
    test.skip(
      !(await page.locator(".day-focus").isVisible()),
      "No local course content — guidance or empty state is shown instead",
    );
    await assertInventory(page, dayFocusInventory);
  });

  test("no-guidance path: Week 3 Day 1", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/select course week/i).selectOption("3");
    await page.getByLabel(/select day of the week/i).selectOption("1");
    await expect(page.locator(".no-guidance")).toBeVisible();
    await assertInventory(page, noGuidanceInventory);
  });
});

test.describe("Visual inventory with workspace selected", () => {
  test.use({ storageState: "e2e/storage/workspace-selected.json" });

  test("run affordances visible when guidance is active", async ({ page }) => {
    await page.goto("/");
    test.skip(
      !(await page.locator(".guidance-header").isVisible()),
      "Day-focus or other layout — run-all is guidance-only",
    );
    await assertInventory(page, guidanceWithWorkspaceInventory);
  });
});
