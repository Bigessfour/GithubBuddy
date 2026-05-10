/**
 * Renderer-side logging: mirrors to devtools console and, in Electron, the shared log file via preload IPC.
 */

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export function appLog(
  level: AppLogLevel,
  scope: string,
  message: string,
  meta?: unknown,
): void {
  const label = `[${scope}] ${message}`;
  switch (level) {
    case "debug":
    case "info":
      console.log(label, meta ?? "");
      break;
    case "warn":
      console.warn(label, meta ?? "");
      break;
    case "error":
      console.error(label, meta ?? "");
      break;
  }

  try {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    if (api?.writeLog) {
      void api.writeLog({ level, scope, message, meta });
    }
  } catch {
    /* ignore IPC failures */
  }
}
