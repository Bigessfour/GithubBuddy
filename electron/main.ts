/**
 * Electron Main Process (Updated for reliable development)
 *
 * This version loads the Vite development server URL when available,
 * which gives us excellent hot reload during development while still
 * running as a real native desktop application.
 *
 * This pattern is widely used and recommended in the Electron community
 * when combining Vite with Electron.
 *
 * References:
 * - https://www.electronjs.org/docs/latest/tutorial/quick-start
 * - https://www.electronjs.org/docs/latest/api/browser-window
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Development: load from Vite dev server (fast HMR)
  // Production: load the built file
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    /**
     * Load the Vite development server.
     * We use port 5173 because we configured Vite with `strictPort: true`.
     * This ensures the same port is used on Windows, macOS, and Linux.
     *
     * Cross-platform note:
     * - On Windows, the URL is the same (http://localhost:5173)
     * - On macOS/Linux, the same URL works
     * - No path differences are needed for the renderer
     */
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

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
