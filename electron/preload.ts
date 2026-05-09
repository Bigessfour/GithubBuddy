/**
 * Electron Preload Script – v0.5 (Aligned with Official Recommendations)
 *
 * Official Documentation:
 * - https://www.electronjs.org/docs/latest/tutorial/context-isolation
 * - https://www.electronjs.org/docs/latest/api/context-bridge
 *
 * This file is the ONLY place where we are allowed to use Node.js / Electron APIs
 * while keeping `contextIsolation: true` (the recommended security setting).
 *
 * We now use the modern ESM import style, which is the preferred pattern
 * when using `electron-vite` with TypeScript.
 */

import { contextBridge, ipcRenderer } from 'electron';

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
