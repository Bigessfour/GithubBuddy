/**
 * Renderer-side logging: mirrors to devtools console and, in Electron, the shared log file via preload IPC.
 */

export type AppLogLevel = "debug" | "info" | "warn" | "error";

function formatMetaForConsole(meta: unknown): string {
  if (meta === undefined) return "";
  if (typeof meta === "string") return meta;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

export function appLog(
  level: AppLogLevel,
  scope: string,
  message: string,
  meta?: unknown,
): void {
  const label = `[${scope}] ${message}`;
  const extra = formatMetaForConsole(meta);
  switch (level) {
    case "debug":
    case "info":
      console.log(label, extra);
      break;
    case "warn":
      console.warn(label, extra);
      break;
    case "error":
      console.error(label, extra);
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
