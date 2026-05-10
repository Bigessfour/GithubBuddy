/**
 * Preload-only: send structured logs to the main process for the shared log file.
 */

import { ipcRenderer } from "electron";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export function reportToMainLog(
  level: AppLogLevel,
  scope: string,
  message: string,
  meta?: unknown,
): void {
  void ipcRenderer.invoke("app-log", {
    level,
    scope,
    message,
    meta,
  });
}
