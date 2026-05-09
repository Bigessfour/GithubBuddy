# Platoon Companion

A helpful desktop/web companion app for Code Platoon AI DevOps students. It guides you through the correct GitHub workflow for each day's lesson, lab, and challenge so you build strong professional habits from day one.

## What Problem Does It Solve?

In the Code Platoon course, instructors often say things like:

> "Clone today's files, create a branch or fork, complete the challenge, then open a PR to your fork for review."

Many students are new to the terminal and GitHub best practices. This app removes the guesswork by giving you:

- A clear, step-by-step checklist for the exact day you're on
- Plain-English explanations of *why* each step follows professional GitHub workflow
- Ready-to-copy terminal / `gh` commands
- Future: One-click "Run" buttons that safely execute commands in your chosen workspace

**Goal**: Turn every daily task into a repeatable, best-practice habit instead of copy-pasting commands you don't fully understand.

---

## Our Git Workflow – Leading by Example

This project doesn't just *teach* GitHub best practices — it **follows them**.

### How We Use GitHub in This Repository

- The complete v1 (fully working React + TypeScript app with tests, educational comments, and documentation) was pushed directly to the `main` branch. This establishes a stable, working baseline that anyone can clone and run immediately.
- All future development happens on **short-lived feature branches** (examples: `feat/add-week3-day1-guidance`, `feat/electron-desktop-packaging`, `feat/safe-command-execution`).
- Changes are proposed via **Pull Requests** (initially to your fork at `Bigessfour/GithubBuddy`, then reviewed and merged into `main`).
- We never commit directly to `main` after the initial baseline.
- Branch names are descriptive and follow a consistent pattern (`feat/`, `fix/`, `docs/`, etc.).
- Every PR includes a clear description linking back to the feature or educational goal.

### Why We Do It This Way

By applying the exact same workflow the app teaches, this project becomes a living example. Students (and instructors) can look at the commit history and branch structure of `GithubBuddy` and see professional GitHub flow in action — the same habits the Platoon Companion app is designed to instill.

This is especially powerful for the Code Platoon AI DevOps course: the tool you use to learn best practices is itself built using those best practices.

References we followed:
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Pro Git – Branching](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Tech Stack & Why We Chose These Tools

### Languages

| Language     | Why We Use It                                                                 | Documentation Referenced |
|--------------|-------------------------------------------------------------------------------|--------------------------|
| **TypeScript** | Type safety catches mistakes early. Excellent IDE support and autocompletion. Industry standard for serious React apps. | [TypeScript Handbook](https://www.typescriptlang.org/docs/) |
| **React 19**   | Component-based UI. Fast, declarative, and has a huge ecosystem. Perfect for building interactive checklists and day selectors. | [React Docs](https://react.dev/) |
| **CSS / Modern CSS** | We will use clean, scoped styles (and optionally Tailwind later) for a pleasant learning experience. | [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |

### Core Packages & Tools

| Package                        | Category          | Why We Use It                                                                 | Version (current) |
|--------------------------------|-------------------|-------------------------------------------------------------------------------|-------------------|
| **Vite**                       | Build Tool        | Extremely fast dev server and hot module replacement. Official React template. | ^8.0.10 |
| **@vitejs/plugin-react**       | Vite Plugin       | Enables React Fast Refresh and JSX transformation.                            | ^6.0.1 |
| **Electron**                   | Desktop Runtime   | Turns our web app into a real Mac (and Windows/Linux) desktop application.    | ^42.0.1 |
| **electron-vite**              | Electron + Vite   | Official way to use Vite with Electron. Simplifies main/renderer process setup. | ^5.0.0 |
| **vite-plugin-electron**       | Build Plugin      | Helps bundle Electron main process with Vite.                                 | ^0.29.1 |
| **vite-plugin-electron-renderer** | Build Plugin   | Enables Node.js APIs in the renderer process safely.                          | ^0.14.7 |
| **TypeScript ESLint**          | Linting           | Catches common bugs and enforces consistent code style.                       | ^8.58.2 |
| **ESLint + React plugins**     | Linting           | React-specific rules (hooks, refresh) to keep code clean.                     | Various |

### Planned / Future Packages

- **Vitest** – Vite-native unit testing (very fast, same config as Vite)
- **React Testing Library** – Component testing that encourages good accessibility practices
- **Playwright** (optional later) – End-to-end testing of the full workflow

---

## Project Outline & How It Works

### High-Level Architecture

```
platoon-companion/
├── src/
│   ├── components/          # Reusable UI pieces (DaySelector, StepCard, CommandBlock, etc.)
│   ├── data/                # JSON or TypeScript files describing each day's guidance
│   ├── hooks/               # Custom React hooks (useDayGuidance, useClipboard, etc.)
│   ├── utils/               # Helper functions (command runner, path helpers)
│   ├── App.tsx              # Main layout
│   └── main.tsx             # React entry point
├── electron/                # Electron main process code (when we enable desktop mode)
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
5. **Future enhancement**: Choose your local workspace folder → "Run" button executes the command safely and shows output.

### Data-Driven Design

All daily guidance lives in easy-to-edit files under `src/data/`. This means:
- Instructors or students can add new days without touching React code.
- We can start with Week 2 Day 4 as the first complete example.

---

## Current Project Status (as of May 9, 2026)

- ✅ Vite + React 19 + TypeScript project initialized
- ✅ Electron and supporting plugins installed
- ✅ TypeScript, ESLint, and React plugins configured
- 🚧 Core UI and data model being built
- 🚧 Week 2 Day 4 guidance content being authored

---

## Running the App (v1)

```bash
cd ~/Desktop/platoon-companion
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

## Getting Started (for Developers)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (opens in browser)
npm run dev

# 3. (Later) Build for production
npm run build

# 4. (Later) Run as desktop app
npm run electron:dev
```

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

**Planned Testing Layers:**

1. **Unit Tests** (Vitest)
   - Pure functions (command builders, date parsers, clipboard helpers)
   - Run with: `npm run test`

2. **Component Tests** (React Testing Library + Vitest)
   - DaySelector, StepCard, CommandBlock components
   - Ensure accessibility (ARIA labels, keyboard navigation)

3. **Integration / E2E** (Playwright – later)
   - Full workflow: select day → see steps → copy command
   - Simulate running commands in a test workspace

**Current State**: Test setup is prepared (Vitest can be added in one command). No tests written yet because we are still defining the first feature set.

---

## Roadmap (High Level)

- **v0.1** (Now): React web app with day selector + Week 2 Day 4 guidance + copy buttons
- **v0.2**: Add workspace folder picker + safe command execution preview
- **v0.3**: Package as real Mac desktop app using Electron
- **v1.0**: Complete coverage of first 2–3 weeks + progress tracking

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
import { describe, it, expect } from 'vitest';
import { getDayGuidance, days } from './days';

describe('getDayGuidance', () => {
  it('should return the Week 2 Day 4 guidance when requested', () => {
    const guidance = getDayGuidance(2, 4);
    expect(guidance).toBeDefined();
    expect(guidance?.week).toBe(2);
    expect(guidance?.day).toBe(4);
    expect(guidance?.steps.length).toBe(7);
  });

  it('should return undefined for a day that has not been created yet', () => {
    const guidance = getDayGuidance(99, 99);
    expect(guidance).toBeUndefined();
  });

  it('should expose all authored days via the days export', () => {
    expect(Object.keys(days)).toContain('W2D4');
  });
});
```

### Test Execution Output (Proof)

```
 RUN  v4.1.5 /Users/stephenmckitrick/Desktop/platoon-companion

 ✓ src/data/days.test.ts > getDayGuidance > should return the Week 2 Day 4 guidance when requested  1ms
 ✓ src/data/days.test.ts > getDayGuidance > should return undefined for a day that has not been created yet  0ms
 ✓ src/data/days.test.ts > getDayGuidance > should expose all authored days via the days export  0ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  14:33:59
   Duration  81ms (transform 15ms, setup 0ms, import 20ms, tests 1ms, environment 0ms)
```

All tests pass in 81 milliseconds. This gives us confidence that the data model and lookup logic are correct before we add more complex UI tests.

Future tests will cover the custom hook and individual React components.

---

## Contributing / Explaining to Class

This project is intentionally simple and well-documented so students can:
- See how modern frontend tooling works
- Understand the difference between a web app and a desktop app
- Learn professional GitHub workflows by using the app *and* by reading its code

Feel free to ask questions about any part of the stack — that's the whole point of building it together.

---

**Built with ❤️ for Code Platoon AI DevOps cohort**  
*Last updated: May 9, 2026*