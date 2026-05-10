# Platoon Companion

**Version 0.6** — desktop + web UI, safe command execution, and dynamic day focus from your local course clone.

A helpful desktop/web companion app for Code Platoon AI DevOps students. It guides you through the correct GitHub workflow for each day's lesson, lab, and challenge so you build strong professional habits from day one.

## Repository and naming

- **Product name (in the app):** **Platoon Companion**
- **GitHub repository slug:** **`githubbuddy`** — clone with `git clone https://github.com/YOUR_USERNAME/githubbuddy.git`, then `cd githubbuddy` (your local folder name matches the repo).
- **npm package name:** `githubbuddy` (see [`package.json`](package.json)).

Updating from an older clone: workspace/upstream keys in browser storage were renamed; you may need to **choose your workspace folder again** once.

**License:** [MIT](LICENSE) — required for redistribution; keep the file in the repo root.

**Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) (PR workflow, checks, releases/tags).

**Maintainers:** On GitHub, open the repo **About** settings and add a short description, topics (for example `education`, `electron`, `react`, `vite`, `typescript`, `code-platoon`), and confirm the **License** badge shows **MIT**. Optional: rename the GitHub repository to `platoon-companion` only if you want the URL to match the product name everywhere—otherwise keep **`githubbuddy`** and use this README’s clone line.

## What Problem Does It Solve?

In the Code Platoon course, instructors often say things like:

> "Clone today's files, create a branch or fork, complete the challenge, then open a PR to your fork for review."

Many students are new to the terminal and GitHub best practices. This app removes the guesswork by giving you:

- A clear, step-by-step checklist for the exact day you're on
- Plain-English explanations of _why_ each step follows professional GitHub workflow
- Ready-to-copy terminal / `gh` commands
- One-click **Run** buttons that execute allowlisted commands in your chosen workspace (with confirmation and streamed output in the desktop app)

**Goal**: Turn every daily task into a repeatable, best-practice habit instead of copy-pasting commands you don't fully understand.

---

## Git workflow: history, teaching, and next steps

This section is deliberately **honest**: students who run `git log` should not find a story in the README that the history contradicts.

### What `git log` on this repo shows

- **Linear history on `main`.** Through v0.6, changes were integrated by **pushing commits directly to `main`**, not by merging a series of pull requests. That is a common pattern while bootstrapping a small educational codebase; it is **not** the same as full GitHub Flow with review on every change.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, …) are used in commit messages, which matches the habit the app promotes.
- **Topic branches** (for example `polish`) may exist for experiments; they are not yet the primary integration path for this upstream repo.

### What the app still teaches (use this on your fork)

The in-app guidance describes the workflow you should use **in your own work**: short-lived **feature branches**, **pull requests**, and keeping **`main`** in good shape. **Do that on your fork** and in cohort assignments—the checklist is the source of truth for student practice.

### What upstream maintainers should do to “lead by example”

To align this repository with what we teach:

1. Stop landing routine work only via direct pushes to `main`; open **PRs** and use **merge** (or squash-merge) so history shows integration points.
2. Turn on **branch protection** on `main` (see [Enabling Branch Protection](#enabling-branch-protection-required-for-professional-workflow) below) so CI must pass and (optionally) review is required.
3. Keep using **Conventional Commits** and clear PR descriptions.

Until those steps are routine here, treat the app as **teaching** professional GitHub habits; treat this upstream repo’s history as **catching up** to that standard—not as proof it was always done that way.

References:

- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Pro Git – Branching](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Tech Stack & Why We Chose These Tools

### Languages

| Language | Why We Use It | Documentation Referenced |
| --- | --- | --- |
| **TypeScript** | Type safety catches mistakes early. Excellent IDE support and autocompletion. Industry standard for serious React apps. | [TypeScript Handbook](https://www.typescriptlang.org/docs/) |
| **React 19** | Component-based UI. Fast, declarative, and has a huge ecosystem. Perfect for building interactive checklists and day selectors. | [React Docs](https://react.dev/) |
| **CSS / Modern CSS** | We will use clean, scoped styles (and optionally Tailwind later) for a pleasant learning experience. | [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |

### Core Packages & Tools

| Package | Category | Why We Use It | Version (current) |
| --- | --- | --- | --- |
| **Vite** | Build Tool | Extremely fast dev server and hot module replacement. Official React template. | ^8.0.10 |
| **@vitejs/plugin-react** | Vite Plugin | Enables React Fast Refresh and JSX transformation. | ^6.0.1 |
| **Electron** | Desktop Runtime | Turns our web app into a real Mac (and Windows/Linux) desktop application. | ^42.0.1 |
| **electron-vite** | Electron + Vite | Bundles main + preload + renderer; see `electron.vite.config.ts`. | ^5.0.0 |
| **vite-plugin-electron-renderer** | Vite Plugin | Electron renderer config only; shims Node/Electron in the Vite bundle. | ^0.14.7 |
| **TypeScript ESLint** | Linting | Catches common bugs and enforces consistent code style. | ^8.58.2 |
| **ESLint + React plugins** | Linting | React-specific rules (hooks, refresh) to keep code clean. | Various |

### Planned / Future Packages

- Deeper Playwright flows (Electron window, filesystem) beyond the current **browser visual** suite

**Already in use:** Vitest and React Testing Library (`npm test`), plus **Playwright** for browser visual inventory, lightweight interaction smoke tests, and full-page screenshots (`npm run test:e2e`). Setup follows the official [Playwright installation guide](https://playwright.dev/docs/intro); install browsers once with `npx playwright install chromium`.

---

## Project Outline & How It Works

### High-Level Architecture

```text
githubbuddy/
├── src/
│   ├── components/          # Reusable UI pieces (DaySelector, StepCard, CommandBlock, etc.)
│   ├── data/                # JSON or TypeScript files describing each day's guidance
│   ├── hooks/               # Custom React hooks (useDayGuidance, useClipboard, etc.)
│   ├── utils/               # Helper functions (command runner, path helpers)
│   ├── App.tsx              # Main layout
│   └── main.tsx             # React entry point
├── electron/                # Electron main + preload (IPC, filesystem, git helpers)
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### Core User Flow (v1)

1. **Open the app** (runs in browser during development, later as a desktop app).
2. **Enter the day** you're working on (e.g., "Week 2, Day 4" or simply "W2D4").
3. **App looks up** the corresponding guidance data.
4. **You see** a beautiful, numbered checklist with:
   - Step title (e.g., "Create a feature branch")
   - Best-practice explanation ("This keeps main clean and makes code review easier...")
   - The exact command to run (`git checkout -b week2/day4-challenge`)
   - A big "Copy" button
5. **Run from the app** (desktop): Choose your workspace folder → use **Run Command** on a step (confirmation + streamed output). The web build still uses copy-to-clipboard for commands.

### Data-Driven Design

All daily guidance lives in easy-to-edit files under `src/data/`. This means:

- Instructors or students can add new days without touching React code.
- We can start with Week 2 Day 4 as the first complete example.

---

## Current Project Status (v0.6 — May 9, 2026)

- ✅ Vite + React 19 + TypeScript app with ESLint and tests
- ✅ Electron desktop app (dev, build, production preview) with secure preload IPC
- ✅ Workspace folder picker, command preview, and streaming command execution
- ✅ Dynamic week/day scanning and **day focus** markdown loaded from a local course clone (via preload)
- ✅ Guidance panel checklist with persisted progress; upstream repo setup script (`npm run setup-course`)
- ✅ Playwright **browser** inventory + interaction smoke in CI (optional screenshot baselines locally)
- 🔜 Broader day coverage; optional **Electron-window** E2E if you want stricter release checks

---

## v0.6 — Completion checklist (verify your setup)

Use this sequence when you first clone the repo or when you want to confirm everything works end-to-end.

1. **Prerequisites** — Node.js 20+ and Git installed; clone this repository (your fork or the cohort remote you were given), e.g. `git clone https://github.com/YOUR_USERNAME/githubbuddy.git`, then `cd githubbuddy`.

2. **Install dependencies**

   ```bash
   npm install
   ```

   If npm reports a peer dependency conflict between `electron-vite` and Vite 8, install with:

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Course content (required for dynamic day focus)** — Run the guided setup once (or ensure the clone exists at the path the app expects):

   ```bash
   npm run setup-course
   ```

   Alternatively, clone the upstream course repo into `data/course-content/aico-echo` (see **v0.6 – Dynamic Day Focus from Upstream Repo** under [Roadmap](#roadmap-high-level) below for the one-line clone example).

4. **Web smoke test**

   ```bash
   npm run dev
   ```

   Open the app in the browser, pick a week/day, confirm the checklist and copy commands work. If the course clone is present, confirm day focus content loads.

5. **Desktop smoke test**

   ```bash
   npm run electron:dev
   ```

   Confirm the native window shows the same UI, workspace selection, and (if applicable) **Fetch upstream** / refreshed scan after pulling course content.

6. **Quality gate (before a PR)** — matches [CI](.github/workflows/test.yml) (`eslint`, Vitest with coverage thresholds, production **web** build, **Electron** bundle build, Playwright **inventory + interactions** on Ubuntu):

   ```bash
   npm run lint
   npm run test:coverage
   npm run build
   npm run test:e2e:ci
   ```

   For a quicker loop while coding, `npm test` (watch) or `npm test -- --run` skips the coverage threshold check. Full Playwright + screenshot baselines: `npm run test:e2e` (see [e2e/visual/user-facing-inventory.ts](e2e/visual/user-facing-inventory.ts) and [e2e/functional/app-interactions.spec.ts](e2e/functional/app-interactions.spec.ts)); refresh PNGs with `npm run test:e2e:update-snapshots`.

7. **Production-style desktop check** (catches wrong dev-server URL or stale build output)

   ```bash
   npm run electron:build
   npm run electron:preview
   ```

   If the window is blank, run `npm run electron:clean`, repeat step 7, and see **Problem 5** in [Electron troubleshooting](#electron-desktop-app--troubleshooting--ai-assisted-fixes).

8. **Ship it (recommended)** — On **your fork**, use a short-lived feature branch, push, and open a **Pull Request** into `main` after CI is green—the same habit the app’s checklist reinforces. Upstream maintainers are encouraged to adopt the same PR-based integration for this repo (see [Git workflow: history, teaching, and next steps](#git-workflow-history-teaching-and-next-steps)).

---

## Running the App (quick start)

```bash
cd ~/Desktop/githubbuddy
npm install          # if you haven't already
npm run dev          # starts Vite dev server at http://localhost:5173
```

Open the URL in your browser. Select **Week 2 → Day 4**. You will see the full guided checklist with explanations and copy buttons. Check off steps as you complete them — your progress is saved automatically.

---

## How to Add a New Day

All daily guidance lives in a single file: `src/data/days.ts`.

1. Open `src/data/days.ts`
2. Add a new entry to the `days` object using the key format `W{week}D{day}` (example: `W3D1`).
3. Use the `DayGuidance` interface (defined in `src/types/index.ts`).
4. Provide 5–8 steps with clear `title`, `why` (best-practice explanation), `command`, and optional `notes`.
5. Add 4–6 items to `bestPractices`.

Example skeleton:

```ts
'W3D2': {
  week: 3,
  day: 2,
  title: 'Week 3 - Day 2: ...',
  summary: 'One sentence overview...',
  steps: [ /* array of Step objects */ ],
  bestPractices: [ /* strings */ ]
}
```

After saving, the new day immediately appears in the dropdowns. No rebuild required in dev mode.

---

## Getting Started – Installation & Running (Windows & macOS)

Platoon Companion can be run in two ways:

1. **Web version** (opens in your browser) – great for quick development and learning the UI.
2. **Desktop version** (real native app window) – the full experience with future command execution.

### Prerequisites (both platforms)

- Node.js 20+ (we recommend the LTS version)
- Git
- For desktop: nothing extra needed — Electron downloads its own binaries on first run

### Getting the Course Content (Required for v0.6 Dynamic Focus)

To enable the app to load the actual lesson, lab, and challenge content from the upstream repo, run:

```bash
npm run setup-course
```

The script will:

- Prompt you for the upstream repo URL
- Explain private vs public repo security implications
- Guide you on using Personal Access Tokens or SSH keys (GitHub best practices)
- Clone the repo into the correct location

**Security Reminder**: The upstream repo is private. Use a fine-grained PAT with minimal scopes or an SSH key. Never commit credentials.

Official GitHub guidance:

- [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### Option A – Run in the Browser (Recommended while learning the UI)

```bash
# 1. Clone the repository (or download the zip)
git clone https://github.com/YOUR_USERNAME/githubbuddy.git
cd githubbuddy

# 2. Install all dependencies (this also installs Electron for later)
npm install

# 3. Start the development server
npm run dev
```

The app will open automatically in your default browser at `http://localhost:5173`.

**On Windows:** Use the exact same commands in PowerShell, Command Prompt, or Git Bash.

### Option B – Run as a Real Desktop Application (Windows or macOS)

```bash
# After you have run `npm install` once:

# Start both the web dev server and the native desktop window together
npm run electron:dev
```

This command:

- Starts Vite on port 5173 (with hot reload)
- Opens a native application window (Windows or macOS)
- Opens DevTools automatically so you can inspect the React app

**First run on any computer** will download the Electron binary for your operating system (≈ 100–150 MB). This only happens once.

**On Windows:** The same `npm run electron:dev` command works identically and opens a native Windows window.

### Other Useful Commands

| Command                    | What it does                                                                       | When to use                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`              | Web-only development server                                                        | Quick UI work in browser                                                    |
| `npm run electron:dev`     | Full desktop experience with hot reload                                            | Daily development of the app                                                |
| `npm run build`            | Production build of the web app                                                    | Before packaging for distribution                                           |
| `npm run electron:build`   | Build main/preload/renderer into `dist-electron/` + `out/renderer`                 | Before testing production UI locally                                        |
| `npm run electron:preview` | Run Electron against the **built** UI (`cross-env NODE_ENV=production electron .`) | After `electron:build` — avoids white screen from loading a dead dev server |
| `npm run electron:clean`   | Deletes `out/` and `dist-electron/`                                                | When `index.html` or build output seems stale; then rebuild                 |
| `npm run lint`             | ESLint across the repo                                                             | CI and before PRs                                                           |
| `npm test`                 | Run the automated test suite                                                       | Before opening a Pull Request                                               |

### Cross-Platform Notes

- All commands above work on **Windows**, **macOS**, and **Linux**.
- `electron:preview` uses **`cross-env`** so `NODE_ENV=production` is set correctly on Windows too.
- We deliberately use cross-platform tools (`electron-vite`, `cross-env`) so students on any operating system have the same experience.
- No platform-specific code or setup is required for the core desktop flow.

**Official documentation:**

- [Electron Supported Platforms](https://www.electronjs.org/docs/latest/tutorial/supported-platforms)
- [electron-vite Guide](https://electron-vite.org/guide/)

---

## Documentation We Referenced

To ensure we are following current best practices, we consulted:

- [Vite Official Documentation](https://vitejs.dev/)
- [Electron Official Documentation](https://www.electronjs.org/docs/latest)
- [electron-vite GitHub Repository & Docs](https://github.com/electron-vite/electron-vite)
- [React 19 Release Notes & Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- GitHub Best Practices:
  - [GitHub CLI (`gh`) Documentation](https://cli.github.com/)
  - [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
  - [Pro Git Book](https://git-scm.com/book/en/v2) (especially branching and remotes chapters)
- [MDN Web Docs](https://developer.mozilla.org/) for HTML/CSS/JS fundamentals

---

## Testing Strategy

We believe in testing early so the app stays reliable as we add features.

### What we run today

- `npm test` — Vitest watch mode for development
- `npm run test:coverage` — same suite with V8 coverage; **must meet minimum thresholds** in [vitest.config.ts](vitest.config.ts) (CI runs this, not 100% gate — raise thresholds as coverage improves)
- `npm run test:e2e:ci` — Playwright **visual inventory** plus a small **interaction** suite (badge updates, empty state, checklist checkbox when guidance is active — see [e2e/visual/user-facing-inventory.ts](e2e/visual/user-facing-inventory.ts) and [e2e/functional/app-interactions.spec.ts](e2e/functional/app-interactions.spec.ts))
- `npm run test:e2e` — full Playwright run including **full-page screenshot** comparisons (baselines are OS-specific; Chromium snapshots live next to [e2e/visual/screenshots.spec.ts](e2e/visual/screenshots.spec.ts))

### Layers in this repo

1. **Unit tests** — Pure logic: day data (`days.ts`), command templates (`commandInterpolation.ts`), course scanning (`courseScanner.ts`), **upstream URL validation** (`upstreamRepoUrl.ts`), shell allowlisting (`electron/runShellCommand.ts`), preload-only disk helpers (`electron/courseContentScan.ts`, `electron/dayFocusLoader.ts`), storage helpers, clipboard wrapper, etc.

2. **UI component tests** (React Testing Library) — Exercises real DOM and user-visible behavior for:
   - [App.tsx](src/App.tsx), [main.tsx](src/main.tsx) bootstrap
   - [DaySelector.tsx](src/components/DaySelector.tsx) (including **Fetch upstream** and invalid URL handling)
   - [WorkspaceSelector.tsx](src/components/WorkspaceSelector.tsx), [UpstreamPathSelector.tsx](src/components/UpstreamPathSelector.tsx)
   - [GuidancePanel.tsx](src/components/GuidancePanel.tsx), [StepCard.tsx](src/components/StepCard.tsx), [CommandOutput.tsx](src/components/CommandOutput.tsx), [ProgressTracker.tsx](src/components/ProgressTracker.tsx), [DayFocus.tsx](src/components/DayFocus.tsx), [Tooltip.tsx](src/components/Tooltip.tsx), toast layer ([ToastProvider.tsx](src/context/ToastProvider.tsx), [useToast.ts](src/context/useToast.ts))
   - Hooks [useDayGuidance](src/hooks/useDayGuidance.ts), [useDayFocus](src/hooks/useDayFocus.ts)

3. **Playwright (browser)** — Visual **presence** coverage for the Vite app (header, day/workspace/upstream chrome, toast region, footer, and branch-specific UI: guidance checklist with seven steps, **Day focus** when `data/course-content` exists, **no-guidance** for Week 3 Day 1, plus **Run** affordances when workspace is seeded via `e2e/storage/workspace-selected.json`). **Interaction smoke** tests cover selector-driven UI updates and checklist toggling when the guidance layout is active. Does not launch Electron; **Fetch upstream** is desktop-only and is intentionally out of scope here.

4. **Electron entrypoints** (`electron/main.ts`, `electron/preload.ts`) — Not unit-tested in isolation; they are thin wiring layers. We rely on **production build** (`npm run electron:build`), **lint/typecheck**, and the [desktop smoke checklist](#desktop-smoke-checklist-manual) for those paths. **Fetch upstream** still validates URLs in the main process (same `resolveValidatedUpstreamUrl` helper) so the UI cannot be the only gate.

### User edge cases we explicitly cover in tests

| Area                      | Examples                                                                                                                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Upstream fetch URL**    | Blank prompt → default Code Platoon repo; valid `https://github.com/...` or `git@github.com:...`; **rejected** GitLab/other hosts, malformed URLs, and strings with shell metacharacters (`;`, `` ` ``, `$`, `..`) so `git clone` is never given an injectable string. |
| **Dialogs**               | User **cancels** folder picker / prompt → no stale state; Run-all **cancel** on confirm → no commands run.                                                                                                                                                             |
| **Errors & empty states** | Fetch failure / thrown IPC; missing guidance day; empty DayFocus file list; clipboard failures; command execution rejection.                                                                                                                                           |
| **Course content**        | Browser vs Electron scan; missing `getCourseContentScan`; loader throws; `window` undefined (SSR-safe branch).                                                                                                                                                         |

### What professional testers also watch for (not all automated here yet)

- **Accessibility** — Keyboard order, labels, focus traps in modals (we use native `confirm`/`prompt` today), screen reader text for dynamic status.
- **Environments** — Windows vs macOS paths, Electron vs pure browser (`npm run dev`), offline / auth failures for `git`/`gh`.
- **Performance & resilience** — Large command output (capped in main), timeouts, rapid double-clicks.
- **Localization & copy** — Clear error strings (students must know _what_ to fix).
- **Security** — Treat all user-provided strings as untrusted until validated (upstream URL, future free-text fields).
- **E2E** — We already run **browser** Playwright in CI (see above). Full **Electron-window** automation is still optional for class use.

**Integration / E2E** (optional stricter step)

- Full workflow in a real Electron window: select day → fetch (or skip) → run a harmless `git` command in a temp repo (not in CI today — manual [desktop smoke checklist](#desktop-smoke-checklist-manual) covers this).

**Current State**: Unit + component coverage is broad and enforced at **minimum** percentages in CI (not 100% globally). Run `npm run test:coverage` locally for the latest table; see [Proof of Correctness](#proof-of-correctness--automated-tests).

---

## Roadmap (High Level)

- **v0.1** (Completed): React web app with day selector + Week 2 Day 4 guidance + copy buttons
- **v0.2** (Completed): Workspace folder picker + safe command execution preview
- **v0.3** (Completed): Desktop app packaging with Electron (Windows + macOS support)
- **v0.4** (Completed): Run commands from the checklist via Electron IPC (preview + confirmation + workspace scope)
- **v0.5** (Completed): Streaming command output (`spawn` + IPC events)
- **v0.6** (Completed): Dynamic day focus from local course clone; preload-based filesystem scan; production desktop load path fixes; guidance panel + setup script
- **v1.0** (Next): More day coverage in `days.ts`, UI polish, optional Electron-driven E2E

### v0.5 – Live Streaming Command Output (Completed)

In v0.5 we upgraded the command execution from batch (`exec`) to real-time streaming (`spawn`).

**Key improvements:**

- Output appears live in the UI as the command runs
- Separate handling for stdout and stderr
- Uses proper IPC event streaming (`command-output` and `command-complete` events)

**Documentation followed:**

- [Node.js `child_process.spawn`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- [Electron IPC tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)

This makes longer commands (git clone, builds, tests) feel responsive.

### Desktop smoke checklist (manual)

After code changes to IPC or command execution, verify quickly on your machine:

1. Run `npm run electron:dev` and wait for the window.
2. Click **Choose Workspace Folder** and select a real local git repo (your fork).
3. Optionally set **Course / upstream folder** and save, so `{{UPSTREAM}}` resolves in copy steps.
4. Pick **Week 2 · Day 1** (or any day with guidance), then use **Run Command** on a safe step (for example one that only runs `git status` if you add it for testing), or use **Run all runnable steps** only in a throwaway repo.
5. Confirm you see streamed output and that a failing command stops **Run all** with a message in the batch log.

Automated coverage: `npm test` (data helpers, allowlist/segment parsing, and React pieces with mocked `window.electronAPI`).

---

### v0.4 – Safe Command Execution (Completed)

We have now implemented the ability to actually **run** the commands shown in the checklist directly from the app.

**How it works (the documented way):**

We follow the official `electron-vite` + Electron security model:

1. **Preload Script** (`electron/preload.ts`)
   - Uses `contextBridge` to safely expose two methods to the React app.
   - Reference: [Context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

2. **Main Process** (`electron/main.ts` + `electron/runShellCommand.ts`)
   - Handles IPC and runs commands with `child_process.spawn` (shell mode), allowlist checks, timeouts, and output caps.
   - Reference: [ipcMain](https://www.electronjs.org/docs/latest/api/ipc-main)

3. **Configuration** (`electron.vite.config.ts`)
   - Properly configured renderer with `rollupOptions.input: 'index.html'` because our project has the HTML file at the root (standard Vite layout).
   - Reference: [electron-vite config](https://electron-vite.org/config/)

4. **UI Layer**
   - `WorkspaceSelector` now uses the real native dialog.
   - `StepCard` shows a green **Run Command** button when a workspace is selected.
   - Clicking Run shows a confirmation dialog with the exact command (preview).
   - Results (stdout/stderr) are displayed below the step using the new `CommandOutput` component.

**Safety features in v0.4+:**

- Commands are never executed without explicit user confirmation (per-step Run; Run all asks once with a full list).
- The full command is shown in the confirmation dialog.
- Execution uses the user-selected workspace folder as `cwd`.
- Allowlisted prefixes (`git`, `gh`, `mkdir`, `cp`, `echo`) plus segment parsing; timeout and captured-output limits in `runShellCommand`.

**Files added/modified in v0.4:**

- `electron/preload.ts` – Safe API bridge
- `electron/main.ts` – IPC handlers + command execution
- `src/components/WorkspaceSelector.tsx` – Native dialog support
- `src/components/StepCard.tsx` – Run button + confirmation
- `src/components/CommandOutput.tsx` – Result display
- `src/types/electron.d.ts` – TypeScript declarations for `window.electronAPI`

**Key documentation references used:**

- [Context Isolation & Preload Scripts](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC (Renderer ↔ Main)](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [dialog.showOpenDialog](https://www.electronjs.org/docs/latest/api/dialog)
- [child_process.spawn](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

### v0.6 – Dynamic Day Focus from Upstream Repo (Completed)

The app can now load the **full content** of the lesson, lab, and challenge files directly from your local clone of the upstream course repository.

**How it works:**

- Select a Week and Day in the UI.
- If you have cloned `https://github.com/CodePlatoon/aico-echo` into `data/course-content/aico-echo`, the app automatically reads all Markdown files in that day’s folder.
- The full content is displayed instead of (or alongside) the app’s educational guidance.

**Setup (one-time):**

```bash
git clone https://github.com/CodePlatoon/aico-echo.git data/course-content/aico-echo
```

When the local clone is present, the DaySelector shows “full day focus loaded”.

If the clone is missing, the app shows a helpful message directing you to the README instructions.

**Documentation followed:**

- [Vite: conditional logic](https://vitejs.dev/guide/ssr.html#conditional-logic)
- [Electron sandbox and preload scripts](https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts)

### v0.3 – Running as a Real Desktop App (Completed)

We implemented the foundation for running Platoon Companion as a native macOS (and Windows/Linux) desktop application using Electron.

**New commands added:**

```bash
# Run the app as a real desktop window with hot reload
npm run electron:dev

# Build the desktop app for distribution
npm run electron:build
```

**What we did (the documented way):**

- Created `electron/main.ts` – the main process that creates the native window
- Created `electron/preload.ts` – the secure bridge (following context isolation best practices)
- Created `electron.vite.config.ts` – the official `electron-vite` configuration
- Updated `package.json` with proper Electron scripts and entry point

All new files contain extensive educational comments with direct links to the official documentation.

**Key documentation links for learning:**

- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-vite Official Guide](https://electron-vite.org/)
- [Context Isolation & Preload Scripts](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

This puts us on track to deliver a polished desktop experience while teaching students the correct, secure way to build cross-platform desktop apps.

### Cross-Platform Support (Windows & macOS)

The Platoon Companion desktop app is designed to run on both **Windows** and **macOS** (and Linux) using the same codebase.

**Why this works (the documented way):**

- Electron abstracts the differences between operating systems.
- The renderer process (our React app) runs inside Chromium on every platform.
- We use cross-platform Node.js tools (`concurrently`, `wait-on`, `electron-vite`) for the development scripts.
- No platform-specific code paths are needed for the core functionality.

**How to run on Windows:**

Students on Windows use the exact same commands:

```bash
cd githubbuddy
npm install
npm run electron:dev
```

The app will open a native Windows window with the same UI and functionality.

**Official documentation for cross-platform Electron development:**

- [Electron Supported Platforms](https://www.electronjs.org/docs/latest/tutorial/supported-platforms)
- [Writing Cross-Platform Code](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules#writing-cross-platform-code)
- [electron-vite Cross-Platform Guide](https://electron-vite.org/guide/)

We have deliberately avoided any macOS-only or Windows-only APIs in v0.3 so the learning experience is identical regardless of the student's operating system.

---

## Proof of Correctness – Automated Tests

To prove the core logic works, we added a minimal but meaningful test suite using **Vitest** (Vite-native, extremely fast) and **React Testing Library** (for future component tests).

### Test Setup Added

- Installed: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Added `"test": "vitest"` script to `package.json`
- Created [src/data/days.test.ts](src/data/days.test.ts) – tests the data lookup function that powers the entire app

### The Test File (with learning comments)

```ts
/**
 * Automated tests for the days data layer.
 * These tests prove that getDayGuidance works correctly for existing and missing days.
 */
import { describe, it, expect } from "vitest";
import { getDayGuidance, days } from "./days";

describe("getDayGuidance", () => {
  it("should return the Week 2 Day 4 guidance when requested", () => {
    const guidance = getDayGuidance(2, 4);
    expect(guidance).toBeDefined();
    expect(guidance?.week).toBe(2);
    expect(guidance?.day).toBe(4);
    expect(guidance?.steps.length).toBe(7);
  });

  it("should return undefined for a day that has not been created yet", () => {
    const guidance = getDayGuidance(99, 99);
    expect(guidance).toBeUndefined();
  });

  it("should expose all authored days via the days export", () => {
    expect(Object.keys(days)).toContain("W2D4");
  });
});
```

### Test Execution Output (Proof)

```text
 RUN  v4.1.5 /Users/you/dev/githubbuddy

 ✓ src/data/days.test.ts > getDayGuidance > should return the Week 2 Day 4 guidance when requested  1ms
 ✓ src/data/days.test.ts > getDayGuidance > should return undefined for a day that has not been created yet  0ms
 ✓ src/data/days.test.ts > getDayGuidance > should expose all authored days via the days export  0ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  14:33:59
   Duration  81ms (transform 15ms, setup 0ms, import 20ms, tests 1ms, environment 0ms)
```

That sample output is from the first data-layer tests only. The suite now covers helpers, Electron modules, hooks, RTL component tests, and Playwright browser tests (inventory + interactions); run `npm test -- --run` for the Vitest count and `npm run test:e2e:ci` for Playwright. **Continuous integration** runs `npm run lint`, `npm run test:coverage` (minimum thresholds in [vitest.config.ts](vitest.config.ts)), `npm run build`, and `npm run test:e2e:ci` — see [.github/workflows/test.yml](.github/workflows/test.yml).

### Enabling Branch Protection (Required for Professional Workflow)

Branch protection is how this **upstream** repo can match the workflow the app teaches: after you enable it, routine work should show up as **PRs merged into `main`**, not only as linear commits from direct pushes.

Now that CI exists, protect the `main` branch so that:

- Every change must come through a Pull Request
- Required **status checks** (from CI: lint, tests with coverage, build, Playwright browser tests) must pass before merging is allowed

**Step-by-step (with official documentation links):**

1. Go to your repository → **Settings** → **Branches** → **Branch protection rules** → **Add rule** for the branch `main`.

2. Enable these two settings (these are GitHub's recommended defaults for protected branches):
   - **Require a pull request before merging**  
     → Documentation: [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-pull-request-reviews-before-merging)

   - **Require status checks to pass before merging**  
     → Select **"Test / Lint, tests, coverage, build"** and **"Test / Playwright (inventory + interactions)"** (both from [.github/workflows/test.yml](.github/workflows/test.yml))  
     → Documentation: [Require status checks before merging](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-status-checks-before-merging)

3. Save the rule.

After this is enabled, the default path for code to reach `main` is a reviewed, passing Pull Request — the same GitHub Flow the app teaches. (Org admins may still bypass in emergencies; the goal is day-to-day PR discipline.)

**Why this is the documented best practice**:

- It prevents broken code from landing on the stable branch.
- It creates an auditable history of every change.
- It is the same process used by professional teams and open-source projects.

References:

- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [About branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

---

## Contributing / Explaining to Class

This project is intentionally simple and well-documented so students can:

- See how modern frontend tooling works
- Understand the difference between a web app and a desktop app
- Learn professional GitHub workflows by using the app _and_ by reading its code

Feel free to ask questions about any part of the stack — that's the whole point of building it together.

---

## Electron Desktop App – Troubleshooting & AI-Assisted Fixes

During the implementation of the desktop (Electron) version and the "Fetch Upstream Repo Data" button, we encountered several non-obvious issues that are common when combining Vite + React + Electron. The AI coding assistant helped diagnose each one in real time using the running terminal output, DevTools console, and screenshots.

### Problem 1: Preload Script Fails with "Cannot use import statement outside a module"

#### Symptom

```text
Unable to load preload script: .../preload.mjs
SyntaxError: Cannot use import statement outside a module
```

#### Root Cause

`sandbox: true` (the strongest isolation setting) is incompatible with ESM preload scripts produced by `electron-vite`.

#### Fix

Changed `sandbox: true` → `sandbox: false` in `createWindow()` while keeping `contextIsolation: true` and `nodeIntegration: false`. This is the documented secure configuration when using ESM preload.

### Problem 2: Persistent "Insecure Content-Security-Policy" Warning

#### Symptom

```text
Electron Security Warning (Insecure Content-Security-Policy)
This renderer process has either no Content Security Policy set
or a policy with "unsafe-eval" enabled.
```

#### Root Cause

A `<meta http-equiv="Content-Security-Policy">` tag in `index.html` is often ignored or overridden when Electron loads the page via `loadURL`.

#### Fix

Injected the CSP header programmatically from the main process using:

```ts
mainWindow.webContents.session.webRequest.onHeadersReceived(
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173;",
        ],
      },
    });
  },
);
```

This is the officially recommended approach in the Electron security documentation.

### Problem 3: Blank White Window – React App Never Renders

#### Symptom

- Terminal shows `[Main] did-finish-load`
- DevTools shows only the preload log and CSP warning
- No React components, no `[Renderer]` logs, `#root` remains empty

#### Root Cause

Multiple interacting issues:

- **electron-vite** defaults the renderer Vite `root` to `./src/renderer`. This project keeps `index.html` at the **repository root**, so the dev server was serving the wrong tree — diagnostics showed `React entry script tag found in DOM: false` because the loaded HTML was not the real app shell.
- The dev server can still be racing Electron on first connect.
- Missing or misconfigured tooling made renderer errors hard to see.

#### Fixes applied

- Set `renderer.root` to the project root and `rollupOptions.input` to an absolute `index.html` in `electron.vite.config.ts`; aligned `server.port` / `strictPort` with `vite.config.ts`.
- Kept `vite-plugin-electron-renderer` (`renderer()` plugin) for Electron-friendly renderer bundling.
- Main process follows the Electron `app` API: `app.whenReady()` for startup, **dev server only when** `NODE_ENV === 'development'` or `VITE_DEV_SERVER_URL` is set (unpackaged `electron .` after build uses `loadFile`, not localhost), CSP on `session.defaultSession`, and `resolveProductionIndexHtml()` that resolves `../../out/renderer/index.html` from `dist-electron/main` (see Problem 5).
- Dev retries: if the DOM still lacks the React entry script or `did-fail-load` fires, reload the dev URL up to three times (never `loadFile` of `index.html` in dev — `file://` cannot resolve `/src/main.tsx`).
- Startup logging, `console-message` forwarding, `did-fail-load`, and `render-process-gone` handlers for visibility.

### Problem 4: VITE_DEV_SERVER_URL Is Undefined

#### Symptom

```text
[Main] VITE_DEV_SERVER_URL: undefined
[Main] VITE_DEV_SERVER_URL not set, falling back to http://localhost:5173
```

#### Explanation

`electron-vite` only injects this environment variable under certain conditions. The fallback to a hardcoded port works, but a small startup delay is still required.

### Problem 5: Production / Preview Window Is Blank (White Screen)

#### Symptom

- After `npm run electron:build`, opening the app shows an empty white window (no header, no React UI).

#### Root causes we fixed

1. **Wrong path to `index.html`:** The main bundle lives at `dist-electron/main/main.js`. A relative path `../out/renderer/index.html` points under `dist-electron/out/...`, which does **not** exist. The electron-vite renderer output is at the **project root** `out/renderer/`, so the correct relative path is **`../../out/renderer/index.html`**.
2. **Treating every unpackaged run as “dev”:** Using `isDev = !app.isPackaged` made a post-build `electron .` try to load `http://localhost:5173` even when the Vite dev server was off. Production-style runs must use `loadFile` with the built `out/renderer/index.html`.

#### Fixes / workflow

- `resolveProductionIndexHtml()` tries `../../out/renderer/index.html` first, then other candidates.
- `shouldLoadDevServer()` is `true` only when unpackaged **and** (`NODE_ENV === 'development'` or `VITE_DEV_SERVER_URL` is set).
- Run a local production smoke test after build: `npm run electron:preview` (sets `NODE_ENV=production` before `electron .`). Packaged apps use `app.isPackaged === true` and always load from disk.

### Outcome

After applying the fixes above, the desktop app successfully renders the full React UI, including the new **"Fetch Upstream Repo Data"** button (visible only when `window.electronAPI` exists). The button triggers a secure `git clone` / `git pull` of the private upstream course repository and refreshes the dynamic week/day selector.

All changes were made iteratively with the AI assistant reviewing terminal output, DevTools console, and screenshots in real time — exactly the workflow this project encourages students to adopt.

---

**Built with ❤️ for Code Platoon AI DevOps cohort**  
_Last updated: May 9, 2026_
