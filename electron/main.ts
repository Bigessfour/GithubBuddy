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

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

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
 * - sandbox: true                   → Recommended for all renderers (strongest isolation)
 * - webSecurity: true               → Enforces same-origin policy and CSP
 * - preload: <path>                 → Only safe bridge between renderer and main process
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,                    // Official recommendation for all renderers
      webSecurity: true,                // Enforces same-origin policy
      preload: path.join(__dirname, '../preload/preload.mjs'),
    },
  });

  /**
   * Development vs Production Loading
   *
   * electron-vite sets the environment variable `VITE_DEV_SERVER_URL` during development.
   * This is the officially recommended way to load the renderer during development.
   *
   * Reference: https://electron-vite.org/guide/
   */
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    // Preferred method: use the URL provided by electron-vite
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else if (isDev) {
    // Fallback (for manual testing)
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
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

/* ============================================================
   App Lifecycle
   ============================================================ */

app.whenReady().then(() => {
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
