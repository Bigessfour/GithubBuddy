/**
 * Electron Main Process – v0.4 Safe Command Execution
 *
 * This file now handles two important IPC channels:
 * 1. 'select-workspace' – Opens a native folder picker using Electron's dialog API
 * 2. 'execute-command' – Safely runs a shell command inside a user-chosen directory
 *
 * Why we do command execution in the main process:
 * - The renderer process is sandboxed for security.
 * - Only the main process can safely use `child_process` and `dialog`.
 * - This follows the official Electron security model.
 *
 * Safety measures implemented in v0.4:
 * - We always receive the full command and working directory from the renderer.
 * - The UI (StepCard) will show a preview + confirmation before calling this.
 * - We use `child_process.spawn` with an explicit `cwd` and no shell.
 * - We return structured results instead of throwing, so the UI can display errors nicely.
 *
 * Official documentation links:
 * - IPC Main: https://www.electronjs.org/docs/latest/api/ipc-main
 * - dialog.showOpenDialog: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogoptions
 * - child_process.spawn: https://nodejs.org/api/child_process.html#child_processspawnfile-args-options
 * - Security Best Practices: https://www.electronjs.org/docs/latest/tutorial/security
 */

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
  type WebContents,
} from "electron";
import path from "path";
import fs from "fs";
import { runShellCommand } from "./runShellCommand";
import { resolveValidatedUpstreamUrl } from "../src/utils/upstreamRepoUrl";
import { writeReadOnlyUpstreamRecord } from "./upstreamRecordFile";
import { UPSTREAM_STATUS_GH } from "../src/content/githubWorkflowHints";
import type { FetchUpstreamErrorCode } from "../src/types/fetchUpstream";
import {
  classifyGitRemoteFailure,
  isGithubHttpsUrl,
  parseGithubHttpsOwnerRepo,
} from "./classifyGitRemoteFailure";
import {
  ghApiRepoCheck,
  isGhAvailable,
  runGhAuthLoginWeb,
  runGhAuthSetupGit,
} from "./ghAuthForGitHub";
import {
  GitCommandError,
  runGitWithUpstreamProgress,
} from "./runGitWithUpstreamProgress";
import { getAppProjectRoot } from "./projectRoot";
import {
  initAppFileLogging,
  writeAppLog,
  logMainInfo,
  logMainWarn,
  logMainError,
  stringifyLogValue,
  type LogLevel,
} from "./appFileLogger";

const LOG_LEVELS = new Set<LogLevel>(["debug", "info", "warn", "error"]);

ipcMain.handle("app-log", (_event, raw: unknown) => {
  if (!raw || typeof raw !== "object") return;
  const e = raw as Record<string, unknown>;
  if (
    typeof e.level !== "string" ||
    typeof e.scope !== "string" ||
    typeof e.message !== "string"
  ) {
    return;
  }
  if (!LOG_LEVELS.has(e.level as LogLevel)) return;
  writeAppLog(e.level as LogLevel, e.scope, e.message, e.meta);
});

process.on("uncaughtException", (err) => {
  console.error(err);
  try {
    initAppFileLogging();
    writeAppLog("error", "Process", "uncaughtException", err);
  } catch {
    /* ignore */
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
  try {
    initAppFileLogging();
    writeAppLog(
      "error",
      "Process",
      "unhandledRejection",
      reason instanceof Error ? reason : { reason: String(reason) },
    );
  } catch {
    /* ignore */
  }
});

/**
 * electron-vite writes the renderer bundle to project-root `out/renderer/`.
 * Main process lives at `dist-electron/main/main.js`, so we must go up **two** levels:
 *   dist-electron/main → ../../out/renderer/index.html
 * Using `../out/renderer` incorrectly resolves to dist-electron/out/... (missing) → blank window.
 */
function resolveProductionIndexHtml(): string {
  const candidates = [
    path.join(__dirname, "../../out/renderer/index.html"),
    path.join(__dirname, "../../dist/index.html"),
    path.join(app.getAppPath(), "out", "renderer", "index.html"),
    path.join(app.getAppPath(), "dist", "index.html"),
    // Legacy / mistaken layout (keep last)
    path.join(__dirname, "../out/renderer/index.html"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      logMainInfo("[Main] Resolved production index.html:", p);
      return p;
    }
  }
  const fallback = path.join(__dirname, "../../out/renderer/index.html");
  logMainError("[Main] No index.html found. Tried:", candidates.join(", "));
  return fallback;
}

/**
 * Only load the Vite dev server when actually running `electron-vite dev`.
 * Unpackaged `electron .` after `electron-vite build` must use loadFile, or you get a white screen
 * when localhost:5173 is not running. See app.isPackaged: https://www.electronjs.org/docs/latest/api/app#appispackaged
 */
function shouldLoadDevServer(): boolean {
  if (app.isPackaged) return false;
  return (
    process.env.NODE_ENV === "development" ||
    Boolean(process.env.VITE_DEV_SERVER_URL)
  );
}

/**
 * Creates the main application window following official Electron security recommendations.
 *
 * Official Documentation References:
 * - https://www.electronjs.org/docs/latest/tutorial/security#3-enable-sandbox-for-all-renderers
 * - https://www.electronjs.org/docs/latest/api/web-contents#webpreferences
 * - https://electron-vite.org/guide/ (for VITE_DEV_SERVER_URL pattern)
 *
 * Security settings applied:
 * - nodeIntegration: false          → Renderer cannot access Node.js directly
 * - contextIsolation: true          → Renderer and preload run in separate JavaScript contexts
 * - sandbox: false                  → ESM preload from electron-vite requires unsandboxed preload (contextIsolation still on)
 * - webSecurity: true               → Enforces same-origin policy and CSP
 * - preload: <path>                 → Only safe bridge between renderer and main process
 */
function createWindow() {
  logMainInfo("[Main] createWindow() called");

  const loadFromDevServer = shouldLoadDevServer();
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const rendererUrl = devUrl || "http://localhost:5173";
  /** Retries when the Vite dev server is slow or serves an unexpected document (per startup plan). */
  let devLoadRetries = 0;
  const maxDevRetries = 3;

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for ESM preload scripts; still secure with contextIsolation
      webSecurity: true, // Enforces same-origin policy
      preload: path.join(__dirname, "../preload/preload.mjs"),
    },
  });

  logMainInfo(
    "[Main] BrowserWindow created, preload path:",
    path.join(__dirname, "../preload/preload.mjs"),
  );

  /**
   * Development vs Production Loading (using official app API)
   *
   * - app.isPackaged: https://www.electronjs.org/docs/latest/api/app#appispackaged
   * - app.getAppPath() (used inside resolveProductionIndexHtml): https://www.electronjs.org/docs/latest/api/app#appgetapppath
   *
   * electron-vite may set VITE_DEV_SERVER_URL when spawning Electron; we fall back to localhost:5173.
   */
  logMainInfo(
    "[Main] loadFromDevServer:",
    loadFromDevServer,
    "isPackaged:",
    app.isPackaged,
    "NODE_ENV:",
    process.env.NODE_ENV,
    "VITE_DEV_SERVER_URL:",
    devUrl,
  );
  logMainInfo("[Main] Renderer URL (dev only):", rendererUrl);

  const loadDevRenderer = () => {
    logMainInfo("[Main] Loading renderer now:", rendererUrl);
    mainWindow.loadURL(rendererUrl);
  };

  if (loadFromDevServer) {
    setTimeout(loadDevRenderer, 600);
    mainWindow.webContents.openDevTools();
  } else {
    const prodPath = resolveProductionIndexHtml();
    logMainInfo("[Main] Production loadFile:", prodPath);
    mainWindow.loadFile(prodPath);
  }

  // Forward all renderer console messages using the modern event signature
  // This removes the deprecation warning and captures everything from React/Vite
  mainWindow.webContents.on("console-message", (event) => {
    const { level, message, lineNumber, sourceId } = event;
    const logLevel: LogLevel =
      level === 3 ? "error" : level === 2 ? "warn" : "info";
    const text = stringifyLogValue(message);
    writeAppLog(logLevel, "RendererConsole", text, {
      sourceId,
      lineNumber,
    });
    const prefix =
      level === 3
        ? "[Renderer ERROR]"
        : level === 2
          ? "[Renderer WARN]"
          : "[Renderer LOG]";
    console.log(`${prefix} ${text} (${sourceId}:${lineNumber})`);
  });

  mainWindow.webContents.on("did-finish-load", async () => {
    logMainInfo(
      "[Main] did-finish-load - URL now:",
      mainWindow.webContents.getURL(),
    );

    // Diagnostic + fallback (using app API patterns for robustness)
    try {
      const hasScript = await mainWindow.webContents.executeJavaScript(
        `!!document.querySelector('script[type="module"][src*="/src/main.tsx"]')`,
      );
      logMainInfo("[Main] React entry script tag found in DOM:", hasScript);

      const rootHasContent = await mainWindow.webContents.executeJavaScript(
        `document.getElementById('root')?.innerHTML?.length > 0`,
      );
      logMainInfo("[Main] #root element has content:", rootHasContent);

      // file:// index.html would not resolve /src/main.tsx — retry the dev server URL instead.
      if (!hasScript && loadFromDevServer && devLoadRetries < maxDevRetries) {
        devLoadRetries++;
        logMainWarn(
          `[Main] Missing React entry script in DOM; retrying dev URL (${devLoadRetries}/${maxDevRetries})...`,
        );
        setTimeout(loadDevRenderer, 500 * devLoadRetries);
      } else if (!hasScript && loadFromDevServer) {
        logMainError(
          "[Main] Dev server still not serving project index.html with React entry. Check electron.vite renderer root matches project root.",
        );
      }
    } catch (err) {
      logMainError("[Main] Diagnostic JS execution failed:", err);
    }
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      logMainError(
        "[Main] did-fail-load:",
        errorCode,
        errorDescription,
        "at",
        validatedURL,
      );

      if (loadFromDevServer && devLoadRetries < maxDevRetries) {
        devLoadRetries++;
        logMainWarn(
          `[Main] did-fail-load: retrying dev URL (${devLoadRetries}/${maxDevRetries})...`,
        );
        setTimeout(loadDevRenderer, 800 * devLoadRetries);
      }
    },
  );

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    logMainError("[Main] Renderer process crashed or was killed:", details);
  });
}

/* ============================================================
   IPC Handlers – v0.4 Safe Command Execution
   ============================================================ */

/**
 * Handler for 'select-workspace'
 *
 * Opens a native system folder picker.
 * Returns the selected directory path or null if cancelled.
 *
 * This replaces the previous `prompt()` hack we used in the web version.
 */
ipcMain.handle("select-workspace", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select your workspace folder",
    message:
      "Choose the folder where you want to run the commands from today's checklist. (On macOS you can use New Folder in the dialog.)",
  });

  if (result.canceled || result.filePaths.length === 0) {
    writeAppLog("info", "IPC", "select-workspace", { canceled: true });
    return null;
  }

  writeAppLog("info", "IPC", "select-workspace", {
    canceled: false,
    pathLength: result.filePaths[0].length,
  });
  return result.filePaths[0];
});

ipcMain.handle("select-upstream-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select course / upstream repository folder",
    message:
      "Choose the root folder of your local clone (e.g. aico-echo). (On macOS you can use New Folder in the dialog.)",
  });

  if (result.canceled || result.filePaths.length === 0) {
    writeAppLog("info", "IPC", "select-upstream-folder", { canceled: true });
    return null;
  }

  writeAppLog("info", "IPC", "select-upstream-folder", {
    canceled: false,
    pathLength: result.filePaths[0].length,
  });
  return result.filePaths[0];
});

/**
 * Pick a parent directory, then renderer prompts for a name and calls
 * `create-workspace-folder` — keeps mkdir in the trusted main process.
 */
ipcMain.handle("select-workspace-parent", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Choose where to create your workspace folder",
    message:
      "Select the parent folder (for example Documents or your Code folder). You will name the new folder next.",
  });

  if (result.canceled || result.filePaths.length === 0) {
    writeAppLog("info", "IPC", "select-workspace-parent", { canceled: true });
    return null;
  }

  writeAppLog("info", "IPC", "select-workspace-parent", {
    canceled: false,
    pathLength: result.filePaths[0].length,
  });
  return result.filePaths[0];
});

function sanitizeWorkspaceFolderName(raw: string): string | null {
  const t = raw.trim().replace(/[/\\:\0]/g, "");
  if (!t || t === "." || t === "..") return null;
  return t;
}

ipcMain.handle(
  "create-workspace-folder",
  async (_event, parentPath: unknown, folderName: unknown) => {
    if (typeof parentPath !== "string" || typeof folderName !== "string") {
      return { ok: false as const, error: "Invalid arguments" };
    }
    const safeName = sanitizeWorkspaceFolderName(folderName);
    if (!safeName) {
      return { ok: false as const, error: "Use a simple folder name (no slashes)." };
    }

    let resolvedParent: string;
    try {
      resolvedParent = path.resolve(parentPath);
    } catch {
      return { ok: false as const, error: "Invalid parent path" };
    }

    const target = path.resolve(resolvedParent, safeName);
    if (path.dirname(target) !== resolvedParent) {
      return { ok: false as const, error: "Invalid folder name" };
    }

    try {
      await fs.promises.mkdir(target, { recursive: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      writeAppLog("warn", "IPC", "create-workspace-folder", {
        error: msg,
        target,
      });
      return {
        ok: false as const,
        error:
          msg.includes("EEXIST") || msg.includes("already exists")
            ? "A folder with that name already exists there. Pick another name or parent."
            : `Could not create folder: ${msg}`,
      };
    }

    writeAppLog("info", "IPC", "create-workspace-folder", {
      pathLength: target.length,
    });
    return { ok: true as const, path: target };
  },
);

/**
 * Handler for 'execute-command' (v0.5 Streaming Version)
 *
 * Uses `child_process.spawn` instead of `exec` to stream output in real time.
 *
 * This follows the documented pattern for interactive/long-running commands in Electron.
 *
 * Flow:
 * 1. Renderer calls invoke('execute-command', command, cwd)
 * 2. Main starts the process with spawn
 * 3. Main sends 'command-output' events for each chunk of stdout/stderr
 * 4. When process exits, Main sends 'command-complete' with final status
 *
 * Documentation References:
 * - spawn: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
 * - Streaming IPC: https://www.electronjs.org/docs/latest/tutorial/ipc#streaming-data
 *
 * Safety:
 * - 60 second timeout (longer than v0.4 to allow real commands)
 * - Explicit cwd
 * - Preview + confirmation still happens in the UI
 */
function resolveExecuteCommandCwd(
  cwd: string,
):
  | { ok: true; resolved: string }
  | { ok: false; message: string } {
  if (!cwd || typeof cwd !== "string" || !cwd.trim()) {
    return {
      ok: false,
      message:
        "Workspace folder is missing or invalid. Choose a folder that exists on disk.",
    };
  }
  const resolved = path.resolve(cwd.trim());
  let realpath: string;
  try {
    realpath = fs.realpathSync(resolved);
  } catch {
    return {
      ok: false,
      message:
        "Workspace folder does not exist or is not reachable. Choose an existing folder on disk.",
    };
  }
  let st: fs.Stats;
  try {
    st = fs.statSync(realpath);
  } catch {
    return {
      ok: false,
      message:
        "Workspace folder is missing or invalid. Choose a folder that exists on disk.",
    };
  }
  if (!st.isDirectory()) {
    return {
      ok: false,
      message: "Workspace path must be a directory.",
    };
  }
  return { ok: true, resolved: realpath };
}

ipcMain.handle(
  "execute-command",
  async (event, command: string, cwd: string) => {
    writeAppLog("info", "IPC", "execute-command", {
      cwd,
      commandLength: command.length,
      command,
    });

    const cwdResult = resolveExecuteCommandCwd(cwd);
    if (!cwdResult.ok) {
      writeAppLog("warn", "IPC", "execute-command rejected", {
        cwd,
        err: cwdResult.message,
      });
      event.sender.send("command-complete", {
        success: false,
        output: "",
        error: cwdResult.message,
        exitCode: -1,
      });
      return {
        success: false,
        output: "",
        error: cwdResult.message,
        exitCode: -1,
      };
    }

    try {
      const result = await runShellCommand(command, cwdResult.resolved, {
        onChunk: (chunk) => event.sender.send("command-output", chunk),
      });

      writeAppLog(
        result.success ? "info" : "warn",
        "IPC",
        "execute-command finished",
        {
          success: result.success,
          exitCode: result.exitCode,
          error: result.error,
          outputChars: result.output?.length ?? 0,
        },
      );

      event.sender.send("command-complete", {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode ?? undefined,
      });

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode ?? undefined,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      writeAppLog("error", "IPC", "execute-command threw", { message });
      event.sender.send("command-complete", {
        success: false,
        output: "",
        error: message,
        exitCode: -1,
      });
      return { success: false, output: "", error: message, exitCode: -1 };
    }
  },
);

function targetHasGitDir(dir: string): boolean {
  return fs.existsSync(path.join(dir, ".git"));
}

/** Removes a partial clone directory (no `.git`) so a retry can `git clone` again. */
function removeIncompleteCloneDir(targetDir: string): void {
  if (!fs.existsSync(targetDir)) return;
  if (targetHasGitDir(targetDir)) return;
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

async function gitSyncCourseRepo(
  sender: WebContents,
  repoUrl: string,
  targetDir: string,
): Promise<"pull" | "clone"> {
  if (targetHasGitDir(targetDir)) {
    sender.send("upstream-status", {
      message: "Updating existing repo with git pull…",
    });
    await runGitWithUpstreamProgress(sender, ["pull", "--progress"], {
      cwd: targetDir,
    });
    sender.send("upstream-status", {
      message: "Pull complete.",
      percent: 100,
    });
    return "pull";
  }

  sender.send("upstream-status", {
    message: "Cloning course repo… (GitHub auth may be required)",
  });
  removeIncompleteCloneDir(targetDir);
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  await runGitWithUpstreamProgress(
    sender,
    ["clone", "--progress", "--", repoUrl, targetDir],
    { cwd: getAppProjectRoot() },
  );
  sender.send("upstream-status", {
    message: "Clone complete.",
    percent: 100,
  });
  return "clone";
}

/**
 * Handler for 'fetch-upstream-repo'
 *
 * Clones or updates the private upstream course repo (aico-echo) into
 * data/course-content/aico-echo so the DaySelector can load dynamic content.
 *
 * Security: Same warnings as setup-course.js (PATs, SSH keys). We never store creds.
 */
ipcMain.handle("fetch-upstream-repo", async (event, repoUrl?: string) => {
  const validated = resolveValidatedUpstreamUrl(repoUrl ?? null);
  if (!validated.ok) {
    writeAppLog("warn", "IPC", "fetch-upstream-repo validation failed", {
      error: validated.error,
    });
    return { success: false, error: validated.error };
  }
  const url = validated.url;
  const TARGET_DIR = path.join(
    getAppProjectRoot(),
    "data",
    "course-content",
    "aico-echo",
  );

  const { sender } = event;

  writeAppLog("info", "IPC", "fetch-upstream-repo start", {
    url,
    targetDir: TARGET_DIR,
    exists: fs.existsSync(TARGET_DIR),
    hasGit: targetHasGitDir(TARGET_DIR),
  });

  const fail = (error: string, code: FetchUpstreamErrorCode) => {
    writeAppLog("error", "IPC", "fetch-upstream-repo failed", {
      url,
      error,
      code,
    });
    return { success: false as const, error, code };
  };

  const succeed = (msg: string) => {
    try {
      writeReadOnlyUpstreamRecord(fs, path, TARGET_DIR, url);
    } catch (recordErr: unknown) {
      const detail =
        recordErr instanceof Error ? recordErr.message : String(recordErr);
      logMainWarn("[Main] Upstream record file not written (clone/pull still OK):", detail);
      writeAppLog("warn", "IPC", "fetch-upstream-repo record file skipped", {
        error: detail,
        targetDir: TARGET_DIR,
      });
    }
    writeAppLog("info", "IPC", "fetch-upstream-repo success", {
      url,
      message: msg,
    });
    return { success: true as const, message: msg };
  };

  try {
    const mode = await gitSyncCourseRepo(sender, url, TARGET_DIR);
    return succeed(
      mode === "pull"
        ? "Repo updated successfully via git pull."
        : "Upstream repo cloned successfully!",
    );
  } catch (err: unknown) {
    if (!(err instanceof GitCommandError)) {
      const message =
        err instanceof Error ? err.message : String(err);
      return fail(message, "FETCH_FAILED");
    }

    const gitErr = err;

    if (
      !isGithubHttpsUrl(url) ||
      classifyGitRemoteFailure(gitErr.stderr) !== "auth_like"
    ) {
      const detail = [gitErr.message, gitErr.stderr].filter(Boolean).join("\n");
      return fail(detail.trim() || gitErr.message, "FETCH_FAILED");
    }

    if (!isGhAvailable()) {
      return fail(
        "GitHub CLI (gh) is not installed. Install from https://cli.github.com/ and try again.",
        "GH_CLI_MISSING",
      );
    }

    sender.send("upstream-status", {
      message: UPSTREAM_STATUS_GH.openingBrowser,
    });
    const login = await runGhAuthLoginWeb();
    if (!login.ok) {
      return fail(login.error, "GH_AUTH_FAILED");
    }

    sender.send("upstream-status", {
      message: UPSTREAM_STATUS_GH.configuringGit,
    });
    try {
      await runGhAuthSetupGit();
    } catch (setupErr: unknown) {
      const setupMsg =
        setupErr instanceof Error ? setupErr.message : String(setupErr);
      logMainWarn("[Main] gh auth setup-git:", setupMsg);
      writeAppLog("warn", "IPC", "gh auth setup-git failed (continuing)", {
        message: setupMsg,
      });
    }

    const parsed = parseGithubHttpsOwnerRepo(url);
    if (parsed) {
      const check = await ghApiRepoCheck(parsed.owner, parsed.repo);
      if (check === "not_found") {
        return fail(
          "GitHub API reports this repository is not visible to the signed-in account (404). Ask your instructor about access or the correct URL.",
          "NO_REPO_ACCESS",
        );
      }
    }

    removeIncompleteCloneDir(TARGET_DIR);

    sender.send("upstream-status", {
      message: UPSTREAM_STATUS_GH.retrying,
    });

    try {
      const mode = await gitSyncCourseRepo(sender, url, TARGET_DIR);
      return succeed(
        mode === "pull"
          ? "Repo updated successfully via git pull."
          : "Upstream repo cloned successfully!",
      );
    } catch (err2: unknown) {
      if (err2 instanceof GitCommandError) {
        const detail = [err2.message, err2.stderr].filter(Boolean).join("\n");
        return fail(detail.trim() || err2.message, "FETCH_FAILED");
      }
      const message =
        err2 instanceof Error ? err2.message : String(err2);
      return fail(message, "FETCH_FAILED");
    }
  }
});

/* ============================================================
   App Lifecycle
   ============================================================ */

/**
 * HTTP + WS origins for dev CSP when Vite may not be on 5173 (strictPort: false).
 * electron-vite sets VITE_DEV_SERVER_URL to the URL the renderer server actually bound to.
 */
function viteDevServerOrigins(): { http: string[]; ws: string[] } {
  const fallbackHttp = ["http://127.0.0.1:5173", "http://localhost:5173"];
  const fallbackWs = ["ws://127.0.0.1:5173", "ws://localhost:5173"];
  const raw = process.env.VITE_DEV_SERVER_URL?.trim();
  if (!raw) {
    return { http: fallbackHttp, ws: fallbackWs };
  }
  try {
    const u = new URL(raw);
    const http = [u.origin];
    const altHost =
      u.hostname === "127.0.0.1"
        ? "localhost"
        : u.hostname === "localhost"
          ? "127.0.0.1"
          : "";
    if (altHost) {
      const copy = new URL(u.href);
      copy.hostname = altHost;
      http.push(copy.origin);
    }
    const wsScheme = u.protocol === "https:" ? "wss" : "ws";
    const portPart = u.port ? `:${u.port}` : "";
    const ws = [`${wsScheme}://${u.hostname}${portPart}`];
    if (altHost) ws.push(`${wsScheme}://${altHost}${portPart}`);
    return { http, ws };
  } catch {
    return { http: fallbackHttp, ws: fallbackWs };
  }
}

app.whenReady().then(() => {
  const logFile = initAppFileLogging();
  logMainInfo("[Main] Log file:", logFile);

  // Dev-only CSP: Vite HMR uses eval, blob workers, and ws:// — see Electron security tutorial.
  // https://www.electronjs.org/docs/latest/tutorial/security
  if (!app.isPackaged) {
    const { http: devHttp, ws: devWs } = viteDevServerOrigins();
    const devCsp =
      "default-src 'self'; " +
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${devHttp.join(" ")} blob:; ` +
      `worker-src 'self' blob: ${devHttp.join(" ")}; ` +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; font-src 'self' data:; " +
      `connect-src 'self' ${devWs.join(" ")} ${devHttp.join(" ")};`;
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const baseUrl = details.url.split(/[?#]/)[0] ?? details.url;
      const isViteDev = devHttp.some((origin) => baseUrl.startsWith(origin));

      const next: Record<string, string[] | undefined> = {
        ...details.responseHeaders,
        "Content-Security-Policy": [devCsp],
      };

      // Align with Vite server.headers: cross-origin isolation for SharedArrayBuffer in dev.
      if (isViteDev) {
        next["Cross-Origin-Opener-Policy"] = ["same-origin"];
        next["Cross-Origin-Embedder-Policy"] = ["require-corp"];
      }

      callback({ responseHeaders: next });
    });
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
