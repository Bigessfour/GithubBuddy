import type { Page, Locator } from "@playwright/test";

/**
 * Single inventory of user-facing visual elements for the web build.
 * Each entry is asserted visible when its `appliesWhen` predicate returns true.
 * This is our working definition of “100% visual coverage” for the browser UI.
 */
export type VisualInventoryItem = {
  id: string;
  description: string;
  locator: (page: Page) => Locator;
  appliesWhen: (page: Page) => Promise<boolean>;
  /** Empty toast stack has no layout box; DOM presence is enough for coverage. */
  expectAttachedOnly?: boolean;
};

/** Layout regions and copy that always render on `/`. */
export const shellInventory: VisualInventoryItem[] = [
  {
    id: "landmark-banner",
    description: "Header landmark",
    locator: (p) => p.locator("header.app-header"),
    appliesWhen: async () => true,
  },
  {
    id: "title-h1",
    description: "App title",
    locator: (p) =>
      p.getByRole("heading", { level: 1, name: /githubbuddy/i }),
    appliesWhen: async () => true,
  },
  {
    id: "tagline",
    description: "Header tagline",
    locator: (p) =>
      p.locator("header.app-header").getByText(/github best practices/i),
    appliesWhen: async () => true,
  },
  {
    id: "day-badge",
    description: "Current day badge in header",
    locator: (p) => p.locator(".current-day-badge"),
    appliesWhen: async () => true,
  },
  {
    id: "landmark-main",
    description: "Main content landmark",
    locator: (p) => p.locator("main.main-content"),
    appliesWhen: async () => true,
  },
  {
    id: "choose-day-heading",
    description: "Day section heading",
    locator: (p) =>
      p.getByRole("heading", { level: 2, name: /choose your day/i }),
    appliesWhen: async () => true,
  },
  {
    id: "week-select",
    description: "Week dropdown",
    locator: (p) => p.getByLabel(/select course week/i),
    appliesWhen: async () => true,
  },
  {
    id: "day-select",
    description: "Day dropdown",
    locator: (p) => p.getByLabel(/select day of the week/i),
    appliesWhen: async () => true,
  },
  {
    id: "day-section-hint",
    description: "Hint under day selector",
    locator: (p) =>
      p
        .locator("section.selector-section")
        .getByText(/select week and day/i),
    appliesWhen: async () => true,
  },
  {
    id: "workflow-help-week",
    description: "Week row help control",
    locator: (p) =>
      p.getByRole("button", {
        name: /help: course week and git branches/i,
      }),
    appliesWhen: async () => true,
  },
  {
    id: "workflow-help-day",
    description: "Day row help control",
    locator: (p) =>
      p.getByRole("button", { name: /help: lesson day/i }),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-heading",
    description: "Workspace section title",
    locator: (p) =>
      p
        .locator(".workspace-selector:not(.upstream-path-selector)")
        .getByRole("heading", { level: 3, name: /workspace folder/i }),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-explanation",
    description: "Workspace explanatory copy",
    locator: (p) =>
      p
        .locator(".workspace-selector:not(.upstream-path-selector)")
        .getByText(/choose the folder/i),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-primary-button",
    description: "Choose or change workspace",
    locator: (p) =>
      p.getByRole("button", {
        name: /choose workspace folder|change workspace folder/i,
      }),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-new-folder-hint",
    description: "Short copy about creating a new workspace folder",
    locator: (p) =>
      p
        .locator(".workspace-selector:not(.upstream-path-selector)")
        .locator(".workspace-new-folder-hint"),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-new-folder-button",
    description: "New folder (parent picker + name) in desktop app",
    locator: (p) =>
      p.getByRole("button", { name: /new folder/i }),
    appliesWhen: async () => true,
  },
  {
    id: "workspace-hint-or-path",
    description: "Workspace empty hint or selected path display",
    locator: (p) =>
      p
        .locator(".workspace-selector:not(.upstream-path-selector)")
        .locator(".workspace-hint, .workspace-path-display"),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-heading",
    description: "Upstream section title",
    locator: (p) =>
      p
        .locator(".upstream-path-selector")
        .getByRole("heading", { level: 3, name: /course \/ upstream folder/i }),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-path-input",
    description: "Upstream path field",
    locator: (p) => p.getByLabel(/upstream course repository path/i),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-save",
    description: "Save upstream path",
    locator: (p) =>
      p
        .locator(".upstream-path-selector")
        .getByRole("button", { name: /^save path$/i }),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-browse",
    description: "Browse upstream (web fallback)",
    locator: (p) =>
      p
        .locator(".upstream-path-selector")
        .getByRole("button", { name: /browse/i }),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-doc-link",
    description: "Inline GitHub doc link in upstream section",
    locator: (p) =>
      p
        .locator(".upstream-path-selector")
        .getByRole("link", { name: /cloning a repository/i }),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-placeholder-code",
    description: "{{UPSTREAM}} token in upstream explanation",
    locator: (p) =>
      p
        .locator(".upstream-path-selector .workspace-explanation")
        .getByText("{{UPSTREAM}}", { exact: true }),
    appliesWhen: async () => true,
  },
  {
    id: "upstream-empty-hint",
    description: "Hint when no upstream path saved",
    locator: (p) =>
      p.locator(".upstream-path-selector p.workspace-hint"),
    appliesWhen: async (page) =>
      page.locator(".upstream-path-selector p.workspace-hint").isVisible(),
  },
  {
    id: "toast-region",
    description: "Toast / notification live region",
    locator: (p) => p.getByRole("region", { name: /notifications/i }),
    appliesWhen: async () => true,
    expectAttachedOnly: true,
  },
  {
    id: "footer",
    description: "Footer copy",
    locator: (p) => p.locator("footer.app-footer"),
    appliesWhen: async () => true,
  },
];

/** Guidance + checklist (when local course focus is absent but `days` has an entry). */
export const guidanceInventory: VisualInventoryItem[] = [
  {
    id: "guidance-title",
    description: "Guidance panel title",
    locator: (p) => p.locator(".guidance-header h2"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "guidance-summary",
    description: "Guidance summary paragraph",
    locator: (p) => p.locator(".guidance-header .summary"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "checklist-heading",
    description: "Checklist column heading",
    locator: (p) =>
      p.getByRole("heading", {
        level: 3,
        name: /step-by-step checklist/i,
      }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "layout-grid",
    description: "Checklist + sidebar grid",
    locator: (p) => p.locator(".layout-grid"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "sidebar",
    description: "Sidebar column",
    locator: (p) => p.locator("aside.sidebar"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "progress-block",
    description: "Progress tracker card",
    locator: (p) => p.locator(".progress-tracker"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "progress-heading",
    description: "Progress heading row",
    locator: (p) => p.locator(".progress-tracker h3.progress-title-row"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "progress-help",
    description: "Progress help control",
    locator: (p) =>
      p.getByRole("button", {
        name: /help: progress and checklist habits/i,
      }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "progress-bar",
    description: "Progress bar track (fill may be 0% width but track is visible)",
    locator: (p) => p.locator(".progress-tracker .progress-bar"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "progress-count-text",
    description: "Steps completed line",
    locator: (p) => p.locator(".progress-text"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "best-practices-heading",
    description: "Sidebar best practices title",
    locator: (p) =>
      p
        .locator(".best-practices")
        .getByRole("heading", { level: 3, name: /github best practices/i }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "best-practices-help",
    description: "Best practices help button",
    locator: (p) =>
      p.getByRole("button", {
        name: /help: how these reminders relate to github flow/i,
      }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "best-practices-doc-fork",
    description: "Fork a repo doc link",
    locator: (p) =>
      p
        .locator(".best-practices")
        .getByRole("link", { name: /fork a repo/i }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "best-practices-doc-pr",
    description: "PR from fork doc link",
    locator: (p) =>
      p
        .locator(".best-practices")
        .getByRole("link", { name: /pull requests from a fork/i }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "best-practices-list",
    description: "Best practices bullet list",
    locator: (p) => p.locator(".best-practices ul"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "step-cards",
    description: "Checklist step cards (count asserted separately)",
    locator: (p) => p.locator(".checklist .step-card").first(),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-title",
    description: "First checklist step title (data-driven)",
    locator: (p) =>
      p.getByRole("heading", {
        level: 3,
        name: /create .*gitignore.*instructor template/i,
      }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-why",
    description: "First step rationale copy",
    locator: (p) =>
      p
        .locator(".step-card")
        .first()
        .locator("p.why"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-command-block",
    description: "Command pre/code block",
    locator: (p) =>
      p.locator(".step-card").first().locator(".command-block pre code"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-copy",
    description: "Copy command button",
    locator: (p) =>
      p
        .locator(".step-card")
        .first()
        .getByRole("button", { name: /copy command to clipboard/i }),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-category-badge",
    description: "Category pill on first step",
    locator: (p) =>
      p.locator(".step-card").first().locator(".category-badge"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
  {
    id: "first-step-checkbox",
    description: "Completion checkbox on first step",
    locator: (p) =>
      p
        .locator(".step-card")
        .first()
        .getByRole("checkbox"),
    appliesWhen: async (page) => page.locator(".guidance-header").isVisible(),
  },
];

/** Extra checklist controls when a workspace path is stored (web: localStorage). */
export const guidanceWithWorkspaceInventory: VisualInventoryItem[] = [
  {
    id: "command-preview-banner",
    description: "CWD preview strip",
    locator: (p) => p.locator(".command-preview-banner"),
    appliesWhen: async (page) =>
      page.locator(".guidance-header").isVisible() &&
      page.locator(".command-preview-banner").isVisible(),
  },
  {
    id: "run-all-button",
    description: "Batch run control",
    locator: (p) =>
      p.getByRole("button", { name: /run all runnable steps/i }),
    appliesWhen: async (page) =>
      page.locator(".guidance-header").isVisible() &&
      page.getByRole("button", { name: /run all runnable steps/i }).isVisible(),
  },
  {
    id: "first-run-command",
    description: "Per-step Run button",
    locator: (p) =>
      p
        .locator(".step-card")
        .first()
        .getByRole("button", { name: /run command/i }),
    appliesWhen: async (page) =>
      page.locator(".guidance-header").isVisible() &&
      page
        .locator(".step-card")
        .first()
        .getByRole("button", { name: /run command/i })
        .isVisible(),
  },
  {
    id: "first-run-hint",
    description: "Run helper text",
    locator: (p) =>
      p
        .locator(".step-card")
        .first()
        .locator(".run-hint"),
    appliesWhen: async (page) =>
      page.locator(".guidance-header").isVisible() &&
      page
        .locator(".step-card")
        .first()
        .locator(".run-hint")
        .isVisible(),
  },
];

/** Dynamic markdown view when `data/course-content` is present in the dev environment. */
export const dayFocusInventory: VisualInventoryItem[] = [
  {
    id: "day-focus-root",
    description: "Day focus container",
    locator: (p) => p.locator(".day-focus"),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
  {
    id: "day-focus-title",
    description: "Day focus main heading",
    locator: (p) =>
      p
        .locator(".day-focus-header")
        .getByRole("heading", { level: 2, name: /week \d+ day \d+.*course materials/i }),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
  {
    id: "day-focus-subtitle",
    description: "Upstream clone subtitle",
    locator: (p) =>
      p.locator(".day-focus-subtitle").filter({
        hasText: /loaded from your local upstream repo clone/i,
      }),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
  {
    id: "day-focus-content",
    description: "Markdown content area",
    locator: (p) => p.locator(".day-focus pre.markdown-content"),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
  {
    id: "day-focus-read-height-slider",
    description: "Slider to resize scrollable lesson/readme viewport",
    locator: (p) =>
      p.getByRole("slider", { name: /reading area height in pixels/i }),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
  {
    id: "day-focus-scroll-region",
    description: "Scrollable region wrapping markdown pre",
    locator: (p) => p.locator(".day-focus-scroll"),
    appliesWhen: async (page) => page.locator(".day-focus").isVisible(),
  },
];

/** Empty state when `getDayGuidance` returns undefined for the selected week/day. */
export const noGuidanceInventory: VisualInventoryItem[] = [
  {
    id: "no-guidance-root",
    description: "No guidance container",
    locator: (p) => p.locator(".no-guidance"),
    appliesWhen: async (page) => page.locator(".no-guidance").isVisible(),
  },
  {
    id: "no-guidance-lead",
    description: "Primary empty-state message",
    locator: (p) =>
      p.getByText(/no guidance available for week/i),
    appliesWhen: async (page) => page.locator(".no-guidance").isVisible(),
  },
  {
    id: "no-guidance-clone-hint",
    description: "Clone path hint",
    locator: (p) =>
      p
        .locator(".no-guidance")
        .getByText(/data\/course-content\/aico-echo/i),
    appliesWhen: async (page) => page.locator(".no-guidance").isVisible(),
  },
];

export const INVENTORY_VERSION = 1;

export function totalInventoryEntries(): number {
  return (
    shellInventory.length +
    guidanceInventory.length +
    guidanceWithWorkspaceInventory.length +
    dayFocusInventory.length +
    noGuidanceInventory.length
  );
}
