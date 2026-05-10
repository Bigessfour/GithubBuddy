/**
 * Append-only file logging for the Electron main process.
 * Dev: project-root `logs/`. Packaged: `userData/logs/`.
 */

import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export type LogLevel = "debug" | "info" | "warn" | "error";

let initialized = false;
let currentLogFile = "";

function getLogsDirectory(): string {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "logs");
  }
  return path.join(app.getAppPath(), "logs");
}

function normalizeMeta(meta: unknown): unknown {
  if (meta instanceof Error) {
    return { name: meta.name, message: meta.message, stack: meta.stack };
  }
  return meta;
}

function formatMeta(meta: unknown): string {
  if (meta === undefined) return "";
  const n = normalizeMeta(meta);
  try {
    return typeof n === "string" ? ` ${n}` : ` ${JSON.stringify(n)}`;
  } catch {
    return ` ${String(n)}`;
  }
}

function appendRaw(line: string): void {
  try {
    fs.appendFileSync(currentLogFile, line, "utf8");
  } catch {
    /* never throw from logger */
  }
}

/**
 * Creates `logs/` and opens the daily log file. Safe to call multiple times.
 */
export function initAppFileLogging(): string {
  if (initialized) return currentLogFile;

  const dir = getLogsDirectory();
  fs.mkdirSync(dir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  currentLogFile = path.join(dir, `platoon-companion-${day}.log`);
  initialized = true;

  appendRaw(
    `\n========== session ${new Date().toISOString()} | platoon-companion ${app.getVersion()} | packaged=${app.isPackaged} ==========\n`,
  );
  return currentLogFile;
}

function ensureReady(): void {
  if (!initialized) {
    initAppFileLogging();
  }
}

export function writeAppLog(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: unknown,
): void {
  try {
    ensureReady();
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level.toUpperCase()}] [${scope}] ${message}${formatMeta(meta)}\n`;
    appendRaw(line);
  } catch {
    /* ignore */
  }
}

export function logMainInfo(message: string, ...args: unknown[]): void {
  writeAppLog("info", "Main", message, args.length ? args : undefined);
  console.log(message, ...args);
}

export function logMainWarn(message: string, ...args: unknown[]): void {
  writeAppLog("warn", "Main", message, args.length ? args : undefined);
  console.warn(message, ...args);
}

export function logMainError(message: string, ...args: unknown[]): void {
  writeAppLog("error", "Main", message, args.length ? args : undefined);
  console.error(message, ...args);
}
