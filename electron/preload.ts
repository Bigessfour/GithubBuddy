/**
 * Electron Preload Script
 *
 * This script runs before the renderer process loads.
 * It has access to both Node.js APIs and the renderer (via contextBridge).
 *
 * Why use a preload script?
 * - It is the ONLY safe place to expose limited Node.js / Electron functionality
 *   to the renderer while keeping contextIsolation enabled.
 * - This is the documented security best practice.
 *
 * Reference: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 * Reference: https://www.electronjs.org/docs/latest/api/context-bridge
 *
 * For v0.3 we keep it minimal. In later versions we will use it to expose
 * safe methods for selecting folders and running commands.
 */

import { contextBridge } from 'electron';

// Example of how we will later expose safe APIs:
// contextBridge.exposeInMainWorld('electronAPI', {
//   selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
// });

console.log('[Preload] Preload script loaded successfully');
