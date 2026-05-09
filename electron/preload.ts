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
   */
  selectWorkspace: (): Promise<string | null> => 
    ipcRenderer.invoke('select-workspace'),

  /**
   * Starts command execution with live streaming (v0.5).
   */
  executeCommand: (command: string, cwd: string) => 
    ipcRenderer.invoke('execute-command', command, cwd),

  /**
   * Listen for live stdout/stderr chunks.
   */
  onCommandOutput: (callback: (data: { type: 'stdout' | 'stderr'; data: string }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('command-output', listener);
    return () => ipcRenderer.removeListener('command-output', listener);
  },

  /**
   * Listen for final command completion.
   */
  onCommandComplete: (callback: (result: any) => void) => {
    const listener = (_event: any, result: any) => callback(result);
    ipcRenderer.on('command-complete', listener);
    return () => ipcRenderer.removeListener('command-complete', listener);
  },
});

console.log('[Preload] v0.4 Preload script loaded – electronAPI exposed safely');
