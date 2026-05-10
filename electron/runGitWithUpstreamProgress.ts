/**
 * Run `git` with stderr streamed to the renderer as `upstream-status` IPC events.
 * Uses `git --progress` style output (stderr) per git-fetch-pack(1) / git-clone(1).
 *
 * Electron pattern: main process sends one-way updates via webContents.send —
 * https://www.electronjs.org/docs/latest/tutorial/ipc#pattern-3-main-to-renderer
 */

import { spawn } from "node:child_process";
import type { WebContents } from "electron";
import { parseGitFetchProgressPercent } from "./parseGitFetchProgress";

/** Thrown when `git` exits non-zero; includes full stderr for auth/access heuristics. */
export class GitCommandError extends Error {
  readonly stderr: string;

  constructor(message: string, stderr: string) {
    super(message);
    this.name = "GitCommandError";
    this.stderr = stderr;
  }
}

export type UpstreamStatusPayload = {
  message: string;
  /** Git-reported 0–100 when parsed from stderr; omitted when unknown */
  percent?: number;
};

function sendStatus(
  webContents: WebContents,
  message: string,
  percent: number | null,
): void {
  const payload: UpstreamStatusPayload = {
    message:
      message.length > 140 ? `${message.slice(0, 137).trimEnd()}…` : message,
  };
  if (percent !== null) payload.percent = percent;
  webContents.send("upstream-status", payload);
}

/**
 * Spawns `git` with the given arguments, forwards stderr lines to the renderer,
 * and resolves when git exits 0.
 */
export function runGitWithUpstreamProgress(
  webContents: WebContents,
  gitArgs: string[],
  options: { cwd?: string } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", gitArgs, {
      cwd: options.cwd,
      windowsHide: true,
    });

    let buffer = "";
    let stderrFull = "";

    const flushThroughDelimiters = () => {
      let idx: number;
      while ((idx = buffer.search(/[\r\n]/)) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        const pct = parseGitFetchProgressPercent(line);
        sendStatus(webContents, line, pct);
      }
    };

    child.stderr?.on("data", (chunk: Buffer) => {
      const s = chunk.toString();
      stderrFull += s;
      buffer += s;
      flushThroughDelimiters();
    });

    child.on("error", reject);

    child.on("close", (code, signal) => {
      flushThroughDelimiters();
      if (buffer.trim()) {
        const line = buffer.trim();
        const pct = parseGitFetchProgressPercent(line);
        sendStatus(webContents, line, pct);
        buffer = "";
      }
      if (code === 0) {
        resolve();
        return;
      }
      const msg = signal
        ? `git terminated by signal ${signal}`
        : `git exited with code ${code ?? "unknown"}`;
      reject(new GitCommandError(msg, stderrFull.trim()));
    });
  });
}
