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
 * - We use `child_process.exec` with an explicit `cwd` option.
 * - We return structured results instead of throwing, so the UI can display errors nicely.
 *
 * Official documentation links:
 * - IPC Main: https://www.electronjs.org/docs/latest/api/ipc-main
 * - dialog.showOpenDialog: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogoptions
 * - child_process.exec: https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
 * - Security Best Practices: https://www.electronjs.org/docs/latest/tutorial/security
 */

import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

/**
 * electron-vite writes the renderer bundle to project-root `out/renderer/`.
 * Main process lives at `dist-electron/main/main.js`, so we must go up **two** levels:
 *   dist-electron/main → ../../out/renderer/index.html
 * Using `../out/renderer` incorrectly resolves to dist-electron/out/... (missing) → blank window.
 */
function resolveProductionIndexHtml(): string {
  const candidates = [
    path.join(__dirname, '../../out/renderer/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(app.getAppPath(), 'out', 'renderer', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'index.html'),
    // Legacy / mistaken layout (keep last)
    path.join(__dirname, '../out/renderer/index.html'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log('[Main] Resolved production index.html:', p);
      return p;
    }
  }
  const fallback = path.join(__dirname, '../../out/renderer/index.html');
  console.error('[Main] No index.html found. Tried:', candidates.join(', '));
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
    process.env.NODE_ENV === 'development' ||
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
  console.log('[Main] createWindow() called');

  const loadFromDevServer = shouldLoadDevServer();
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const rendererUrl = devUrl || 'http://localhost:5173';
  /** Retries when the Vite dev server is slow or serves an unexpected document (per startup plan). */
  let devLoadRetries = 0;
  const maxDevRetries = 3;

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,                   // Required for ESM preload scripts; still secure with contextIsolation
      webSecurity: true,                // Enforces same-origin policy
      preload: path.join(__dirname, '../preload/preload.mjs'),
    },
  });

  console.log('[Main] BrowserWindow created, preload path:', path.join(__dirname, '../preload/preload.mjs'));

  /**
   * Development vs Production Loading (using official app API)
   *
   * - app.isPackaged: https://www.electronjs.org/docs/latest/api/app#appispackaged
   * - app.getAppPath() (used inside resolveProductionIndexHtml): https://www.electronjs.org/docs/latest/api/app#appgetapppath
   *
   * electron-vite may set VITE_DEV_SERVER_URL when spawning Electron; we fall back to localhost:5173.
   */
  console.log(
    '[Main] loadFromDevServer:',
    loadFromDevServer,
    'isPackaged:',
    app.isPackaged,
    'NODE_ENV:',
    process.env.NODE_ENV,
    'VITE_DEV_SERVER_URL:',
    devUrl,
  );
  console.log('[Main] Renderer URL (dev only):', rendererUrl);

  const loadDevRenderer = () => {
    console.log('[Main] Loading renderer now:', rendererUrl);
    mainWindow.loadURL(rendererUrl);
  };

  if (loadFromDevServer) {
    setTimeout(loadDevRenderer, 600);
    mainWindow.webContents.openDevTools();
  } else {
    const prodPath = resolveProductionIndexHtml();
    console.log('[Main] Production loadFile:', prodPath);
    mainWindow.loadFile(prodPath);
  }

  // Forward all renderer console messages using the modern event signature
  // This removes the deprecation warning and captures everything from React/Vite
  mainWindow.webContents.on('console-message', (event) => {
    const { level, message, lineNumber, sourceId } = event;
    const prefix = level === 3 ? '[Renderer ERROR]' : level === 2 ? '[Renderer WARN]' : '[Renderer LOG]';
    console.log(`${prefix} ${message} (${sourceId}:${lineNumber})`);
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    console.log('[Main] did-finish-load - URL now:', mainWindow.webContents.getURL());

    // Diagnostic + fallback (using app API patterns for robustness)
    try {
      const hasScript = await mainWindow.webContents.executeJavaScript(
        `!!document.querySelector('script[type="module"][src*="/src/main.tsx"]')`
      );
      console.log('[Main] React entry script tag found in DOM:', hasScript);

      const rootHasContent = await mainWindow.webContents.executeJavaScript(
        `document.getElementById('root')?.innerHTML?.length > 0`
      );
      console.log('[Main] #root element has content:', rootHasContent);

      // file:// index.html would not resolve /src/main.tsx — retry the dev server URL instead.
      if (!hasScript && loadFromDevServer && devLoadRetries < maxDevRetries) {
        devLoadRetries++;
        console.warn(
          `[Main] Missing React entry script in DOM; retrying dev URL (${devLoadRetries}/${maxDevRetries})...`,
        );
        setTimeout(loadDevRenderer, 500 * devLoadRetries);
      } else if (!hasScript && loadFromDevServer) {
        console.error(
          '[Main] Dev server still not serving project index.html with React entry. Check electron.vite renderer root matches project root.',
        );
      }
    } catch (err) {
      console.error('[Main] Diagnostic JS execution failed:', err);
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[Main] did-fail-load:', errorCode, errorDescription, 'at', validatedURL);

    if (loadFromDevServer && devLoadRetries < maxDevRetries) {
      devLoadRetries++;
      console.warn(`[Main] did-fail-load: retrying dev URL (${devLoadRetries}/${maxDevRetries})...`);
      setTimeout(loadDevRenderer, 800 * devLoadRetries);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Main] Renderer process crashed or was killed:', details);
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
ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select your workspace folder',
    message: 'Choose the folder where you want to run the commands from today\'s checklist',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

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
ipcMain.handle('execute-command', (event, command: string, cwd: string) => {
  return new Promise((resolve) => {
    // Parse command into executable + args (simple split for v0.5)
    const [cmd, ...args] = command.split(' ');

    const child = spawn(cmd, args, {
      cwd,
      shell: true,                // Allows complex commands like "git checkout -b ..."
      windowsHide: true,
      timeout: 60000,             // 60 seconds for v0.5
    });

    let output = '';
    let errorOutput = '';

    // Stream stdout
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      event.sender.send('command-output', { type: 'stdout', data: chunk });
    });

    // Stream stderr
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      event.sender.send('command-output', { type: 'stderr', data: chunk });
    });

    child.on('close', (code) => {
      const success = code === 0;
      event.sender.send('command-complete', {
        success,
        output,
        error: errorOutput || undefined,
        exitCode: code,
      });

      resolve({
        success,
        output,
        error: errorOutput || undefined,
      });
    });

    child.on('error', (err) => {
      event.sender.send('command-complete', {
        success: false,
        output,
        error: err.message,
      });

      resolve({
        success: false,
        output,
        error: err.message,
      });
    });
  });
});

/**
 * Handler for 'fetch-upstream-repo'
 *
 * Clones or updates the private upstream course repo (aico-echo) into
 * data/course-content/aico-echo so the DaySelector can load dynamic content.
 *
 * Security: Same warnings as setup-course.js (PATs, SSH keys). We never store creds.
 */
ipcMain.handle('fetch-upstream-repo', async (event, repoUrl?: string) => {
  const { exec } = await import('child_process');
  const path = await import('path');
  const fs = await import('fs');

  const DEFAULT_UPSTREAM = 'https://github.com/CodePlatoon/aico-echo.git';
  const url = repoUrl || DEFAULT_UPSTREAM;
  const TARGET_DIR = path.join(process.cwd(), 'data', 'course-content', 'aico-echo');

  try {
    if (fs.existsSync(TARGET_DIR)) {
      // Update existing
      event.sender.send('upstream-status', { message: 'Updating existing repo with git pull...' });
      await new Promise((resolve, reject) => {
        exec('git pull', { cwd: TARGET_DIR }, (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve(stdout);
        });
      });
      return { success: true, message: 'Repo updated successfully via git pull.' };
    } else {
      // Clone new
      event.sender.send('upstream-status', { message: `Cloning ${url} ... (may require auth)` });
      fs.mkdirSync(path.dirname(TARGET_DIR), { recursive: true });
      await new Promise((resolve, reject) => {
        exec(`git clone ${url} ${TARGET_DIR}`, { cwd: process.cwd() }, (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve(stdout);
        });
      });
      return { success: true, message: 'Upstream repo cloned successfully!' };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during fetch.';
    return { success: false, error: message };
  }
});

/* ============================================================
   App Lifecycle
   ============================================================ */

app.whenReady().then(() => {
  // Dev-only CSP: Vite HMR uses eval, blob workers, and ws:// — see Electron security tutorial.
  // https://www.electronjs.org/docs/latest/tutorial/security
  if (!app.isPackaged) {
    const devCsp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173 http://localhost:5173 blob:; " +
      "worker-src 'self' blob: http://127.0.0.1:5173 http://localhost:5173; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; font-src 'self' data:; " +
      "connect-src 'self' ws://127.0.0.1:5173 ws://localhost:5173 http://127.0.0.1:5173 http://localhost:5173;";
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [devCsp],
        },
      });
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
