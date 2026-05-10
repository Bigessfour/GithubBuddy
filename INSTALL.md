# Installation guide — Platoon Companion

This document is the **short path to a working install** on your machine. For architecture, roadmap, and deep troubleshooting, see [README.md](README.md).

The **GitHub repository** is named **`githubbuddy`**; after `git clone` you normally `cd githubbuddy`. The app title in the UI remains **Platoon Companion**.

## Requirements

- **Node.js 22.12+** ([nodejs.org](https://nodejs.org/)) — matches the `electron` package and CI; `package.json` declares `engines.node`.
- **Git**
- **GitHub CLI (`gh`)** (recommended for **private** `https://github.com/...` course repos in the desktop app) — [cli.github.com](https://cli.github.com/). If `git clone` / `git pull` fails for missing HTTPS credentials, the app can open a browser sign-in via `gh`; SSH remote URLs use your normal SSH setup instead.
- **macOS, Windows, or Linux** (desktop commands are the same everywhere)

## 1. Get the code

```bash
git clone https://github.com/YOUR_USERNAME/githubbuddy.git
cd githubbuddy
```

Use your fork URL or the cohort remote you were given.

## 2. Install dependencies

```bash
npm install
```

If npm reports a peer dependency conflict between `electron-vite` and Vite 8:

```bash
npm install --legacy-peer-deps
```

The same resolution is used in **GitHub Actions** (`npm ci --legacy-peer-deps` in [.github/workflows/test.yml](.github/workflows/test.yml)), so CI matches a typical local install.

`postinstall` runs **`scripts/ensure-electron.js`** (downloads the Electron binary if `node_modules/electron/path.txt` is missing — avoids `Error: Electron uninstall` from electron-vite) and then the course setup helper (`setup-course`). Follow any prompts, or run explicitly:

```bash
npm run electron:install   # repair Electron binary only (safe to re-run)
npm run setup-course
```

Never use `npm install --ignore-scripts` for this project unless you run `npm run electron:install` afterward.

For dynamic **Day focus** content, you need the course materials under `data/course-content/aico-echo` (see README → v0.6 / setup-course).

## 3. Choose how you run the app

### Option A — Web (browser only)

Best for: quick UI review, no native folder picker / no checklist **Run** in the full desktop sense.

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### Option B — Desktop (Electron, recommended)

Best for: native workspace picker, **Fetch upstream**, streaming **Run** commands, and **file logs** (see below).

```bash
npm run electron:dev
```

The first run downloads the Electron runtime for your OS (one-time, on the order of ~100–150 MB).

**Windows:** Use PowerShell, Command Prompt, or Git Bash — same commands.

## 4. Logs (desktop)

When you run the **desktop** app, runtime logs are appended to a daily file:

| Mode | Location |
|------|----------|
| Development (`npm run electron:dev`) | Project root: `logs/githubbuddy-YYYY-MM-DD.log` |
| Packaged app (if you build installers later) | OS app data directory: `…/logs/githubbuddy-YYYY-MM-DD.log` |

The `logs/` folder is gitignored except `logs/.gitkeep`. After a desktop session, open today’s file to inspect startup, IPC, and renderer events. Older dev builds may have created `platoon-companion-*.log`; current builds use **`githubbuddy-*.log`**.

**Browser-only** (`npm run dev`) does **not** write to that file; use the browser developer console instead.

## 5. Production-style desktop check (optional)

Use this to verify the built UI without the Vite dev server:

```bash
npm run electron:build
npm run electron:preview
```

If the window is blank: `npm run electron:clean`, rebuild, and see README → Electron troubleshooting.

## 6. Verify quality (optional, before contributing)

```bash
npm run lint
npm run test:coverage
npm run build
```

---

**Next steps:** [README.md](README.md) — roadmap, Git workflow, and full troubleshooting.
