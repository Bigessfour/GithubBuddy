/**
 * Electron Preload Script – v0.4 Safe Command Execution
 *
 * This file is the ONLY place where we are allowed to use Node.js / Electron APIs
 * while keeping `contextIsolation: true` (the recommended security setting).
 *
 * What we do here:
 * 1. Use `contextBridge` to safely expose a limited API to the React renderer.
 * 2. Use `ipcRenderer.invoke` to call functions in the main process.
 *
 * Why this architecture?
 * - The renderer (React) cannot directly access `child_process` or `dialog`.
 * - The main process has full system access.
 * - The preload script acts as a controlled gateway.
 *
 * Security best practices we follow:
 * - We never expose raw `ipcRenderer` or `child_process` to the renderer.
 * - We only expose two specific, well-named functions.
 * - All actual dangerous work (executing commands) happens in the main process.
 *
 * Official references:
 * - Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 * - Context Bridge: https://www.electronjs.org/docs/latest/api/context-bridge
 * - IPC (Renderer → Main): https://www.electronjs.org/docs/latest/tutorial/ipc#renderer-to-main
 */

// We must use the CommonJS-style require here because preload runs before ESM is fully set up in some Electron versions
const { contextBridge, ipcRenderer } = require('electron');

/**
 * This is the object that will be available in the renderer as:
 *   window.electronAPI.selectWorkspace()
 *   window.electronAPI.executeCommand(command, workspacePath)
 *
 * We deliberately keep the surface area tiny.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Opens a native folder picker dialog.
   * Returns the selected path or null if the user cancels.
   */
  selectWorkspace: (): Promise<string | null> => 
    ipcRenderer.invoke('select-workspace'),

  /**
   * Executes a shell command inside a specific working directory.
   * 
   * @param command - The full command string (e.g. "git status")
   * @param cwd - The absolute path to the workspace folder
   * @returns Promise resolving to { success, output, error }
   */
  executeCommand: (command: string, cwd: string): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> => 
    ipcRenderer.invoke('execute-command', command, cwd),
});

console.log('[Preload] v0.4 Preload script loaded – electronAPI exposed safely');
