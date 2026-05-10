import { appLog } from "./appLog";

/** Register window-level handlers so failures surface in console and the Electron log file. */
export function installRendererErrorLogging(): () => void {
  const onError = (event: ErrorEvent) => {
    appLog("error", "Renderer", "window.error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error instanceof Error ? event.error.stack : event.error,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const r = event.reason;
    appLog("error", "Renderer", "unhandledrejection", {
      reason: r instanceof Error ? { message: r.message, stack: r.stack } : r,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
