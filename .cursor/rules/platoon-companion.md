# Platoon Companion – Workspace Rules

This file defines the coding standards, architectural decisions, and workflow rules for the Platoon Companion project. These rules are automatically loaded by Cursor for this workspace.

## Project Overview

Platoon Companion is an educational desktop/web application that teaches Code Platoon students professional GitHub and terminal workflows through guided, interactive checklists.

**Core Tech Stack:**
- React 19 + TypeScript
- Vite
- Electron + electron-vite (for desktop)
- Vitest + React Testing Library

**Primary Goal:** Every feature must be educational. Code and documentation must explain *why* we follow the documented best practice, with links to official sources.

## Coding Standards

### 1. TypeScript & React
- Use strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, etc.)
- Prefer functional components + hooks
- All state changes must be immutable
- Lift state up when multiple components need the same data

### 2. Electron Security (Non-Negotiable)
- `contextIsolation: true` must always be enabled
- `nodeIntegration: false` must always be enabled
- All Node.js / system access must go through a preload script using `contextBridge`
- Never expose raw `ipcRenderer` or `child_process` to the renderer
- Reference: [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

### 3. Documentation in Code
- Every new file must start with a detailed JSDoc / comment block explaining:
  - What the file does
  - Why we chose this architecture
  - Links to official documentation
- Inline comments should explain non-obvious decisions

### 4. Commit Messages
- Use Conventional Commits format: `type(scope): short description`
- Examples:
  - `feat(electron): add safe command execution via IPC`
  - `fix(vite): force port 5173 with strictPort`
  - `docs(readme): add cross-platform installation instructions`

### 5. Branching & Git Workflow
- Never commit directly to `main`
- All work happens on short-lived feature branches
- Branch naming: `feat/`, `fix/`, `docs/`, `refactor/`
- Open Pull Requests for all changes
- Reference: [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

### 6. Testing
- All new utilities and hooks must have Vitest unit tests
- Component tests use React Testing Library
- Run `npm test` before opening any Pull Request

## Running the Application

| Command                  | Purpose                              | When to Use                     |
|--------------------------|--------------------------------------|---------------------------------|
| `npm run dev`            | Web version (browser)                | Quick UI iteration              |
| `npm run electron:dev`   | Full desktop app (Windows + macOS)   | Daily development & testing     |
| `npm run test`           | Run automated test suite             | Before every PR                 |
| `npm run electron:build` | Production desktop build             | Creating distributable versions |

## Data & Course Content

- Private course content lives in `data/course-content/aico-echo` (read-only)
- The app scans this folder to populate dynamic Week/Day selectors
- Never commit anything from `data/` to git
- Reference: `data/course-content/README.md`

## When Working on Electron / Desktop Features

- Always test on both macOS and Windows when possible
- Use `window.electronAPI` (exposed via preload) instead of direct Node APIs
- Command execution must always include user confirmation + preview
- Use `child_process.exec` with explicit `cwd` and timeout in the main process

## References (Always Link These When Relevant)

- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-vite Documentation](https://electron-vite.org/)
- [Vite Configuration](https://vitejs.dev/config/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** May 9, 2026
**Maintained by:** Code Platoon AI DevOps cohort project