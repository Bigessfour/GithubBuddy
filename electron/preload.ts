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

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { scanCourseContentFromDisk } from "./courseContentScan";
import { loadDayFocusFromDisk } from "./dayFocusLoader";
import { reportToMainLog, type AppLogLevel } from "./reportToMainLog";

/**
 * This is the object that will be available in the renderer as:
 *   window.electronAPI.selectWorkspace()
 *   window.electronAPI.executeCommand(command, workspacePath)
 *
 * We deliberately keep the surface area tiny.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Writes one structured line to the shared app log file (main process).
   */
  writeLog: (entry: {
    level: AppLogLevel;
    scope: string;
    message: string;
    meta?: unknown;
  }) => ipcRenderer.invoke("app-log", entry),

  /**
   * Opens a native folder picker dialog.
   */
  selectWorkspace: (): Promise<string | null> =>
    ipcRenderer.invoke("select-workspace"),

  /** Parent directory for “New folder…” workspace flow (see createWorkspaceFolder). */
  selectWorkspaceParent: (): Promise<string | null> =>
    ipcRenderer.invoke("select-workspace-parent"),

  /**
   * Create a single new folder under `parentPath` (main process only).
   * Renderer should prompt for `folderName` first.
   */
  createWorkspaceFolder: (
    parentPath: string,
    folderName: string,
  ): Promise<
    { ok: true; path: string } | { ok: false; error: string }
  > => ipcRenderer.invoke("create-workspace-folder", parentPath, folderName),

  /** Native folder picker for the local course/upstream clone (copy source paths). */
  selectUpstreamFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("select-upstream-folder"),

  /**
   * Starts command execution with live streaming (v0.5).
   */
  executeCommand: (command: string, cwd: string) =>
    ipcRenderer.invoke("execute-command", command, cwd),

  /**
   * Listen for live stdout/stderr chunks.
   */
  onCommandOutput: (
    callback: (data: { type: "stdout" | "stderr"; data: string }) => void,
  ) => {
    const listener = (
      _event: IpcRendererEvent,
      data: { type: "stdout" | "stderr"; data: string },
    ) => callback(data);
    ipcRenderer.on("command-output", listener);
    return () => ipcRenderer.removeListener("command-output", listener);
  },

  /**
   * Listen for final command completion.
   */
  onCommandComplete: (
    callback: (result: {
      success: boolean;
      output: string;
      error?: string;
      exitCode?: number;
    }) => void,
  ) => {
    const listener = (
      _event: IpcRendererEvent,
      result: {
        success: boolean;
        output: string;
        error?: string;
        exitCode?: number;
      },
    ) => callback(result);
    ipcRenderer.on("command-complete", listener);
    return () => ipcRenderer.removeListener("command-complete", listener);
  },

  /**
   * Fetch (clone or pull) the upstream course repo.
   * Returns { success, message?, error? }
   */
  fetchUpstreamRepo: (repoUrl?: string) =>
    ipcRenderer.invoke("fetch-upstream-repo", repoUrl),

  /**
   * Listen for live status during fetch (git stderr + optional 0–100 from progress lines).
   * Main → renderer one-way IPC; see https://www.electronjs.org/docs/latest/tutorial/ipc
   */
  onUpstreamStatus: (
    callback: (data: { message: string; percent?: number }) => void,
  ) => {
    const listener = (
      _event: IpcRendererEvent,
      data: { message: string; percent?: number },
    ) => callback(data);
    ipcRenderer.on("upstream-status", listener);
    return () => ipcRenderer.removeListener("upstream-status", listener);
  },

  /**
   * Synchronous scan of data/course-content/aico-echo (Node fs runs in preload, not renderer).
   * Renderer must not import fs — Vite bundles ESM where require/import of fs breaks.
   */
  getCourseContentScan: () => scanCourseContentFromDisk(),

  /** Full markdown files for a week/day folder (sync fs in preload). */
  getDayFocusContent: (week: number, day: number) =>
    loadDayFocusFromDisk(week, day),
});

reportToMainLog(
  "info",
  "Preload",
  "Preload script loaded – electronAPI exposed safely",
);
reportToMainLog("info", "Preload", "process.versions", {
  node: process.versions.node,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
});
