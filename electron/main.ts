/**
 * Electron Main Process
 *
 * This file runs in the main process (Node.js environment).
 * It is responsible for:
 * - Creating and managing the application window(s)
 * - Handling app lifecycle events (ready, activate, quit)
 * - Communicating with the renderer process via IPC (when needed)
 *
 * Why we use a separate main process:
 * - Electron follows a multi-process architecture (main + renderer).
 * - The main process has full Node.js and system access.
 * - The renderer process is a Chromium browser window (sandboxed by default for security).
 *
 * Educational references (click to read the official docs):
 * - Electron Main Process: https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process
 * - BrowserWindow API: https://www.electronjs.org/docs/latest/api/browser-window
 * - App Module (lifecycle): https://www.electronjs.org/docs/latest/api/app
 * - Security Best Practices: https://www.electronjs.org/docs/latest/tutorial/security
 *
 * We are using `electron-vite` which provides excellent defaults and hot reloading
 * for both main and renderer processes during development.
 * Reference: https://github.com/electron-vite/electron-vite
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname is not available in ESM, so we recreate it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates the main application window.
 *
 * We enable several security best practices by default:
 * - nodeIntegration: false (never enable this in production)
 * - contextIsolation: true (recommended and default in modern Electron)
 * - preload script (we will add one in the next iteration for safe IPC)
 *
 * These settings follow the official Electron security recommendations.
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security: Disable Node.js integration in the renderer
      nodeIntegration: false,
      // Security: Enable context isolation (strongly recommended)
      contextIsolation: true,
      // We will add a preload script later for controlled IPC
      // preload: path.join(__dirname, 'preload.js'),
    },
  });

  // In development, load from the Vite dev server (hot reload)
  // In production, load the built files
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open DevTools automatically in development (very useful while learning)
    mainWindow.webContents.openDevTools();
  } else {
    // Production build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

/**
 * App lifecycle: When Electron has finished initialization
 * and is ready to create browser windows.
 *
 * This is the documented entry point for most Electron apps.
 * Reference: https://www.electronjs.org/docs/latest/api/app#event-ready
 */
app.whenReady().then(() => {
  createWindow();

  /**
   * On macOS, it is common to re-create a window when the dock icon is clicked
   * and there are no other windows open.
   * This is part of the standard macOS application behavior.
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit the app when all windows are closed, except on macOS.
 * On macOS, applications typically stay active until the user quits explicitly.
 * This matches native macOS behavior.
 * Reference: https://www.electronjs.org/docs/latest/api/app#event-window-all-closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
