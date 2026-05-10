/**
 * Trusted-student-tool execution wrapper: spawn via shell with cwd, allowlist, caps, and timeout.
 * Extracted for unit testing without Electron.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

/** Max combined captured stdout+stderr per invocation (streaming still fires; capture truncates). */
export const MAX_CAPTURED_OUTPUT_CHARS = 100_000;

export const DEFAULT_COMMAND_TIMEOUT_MS = 60_000;

/**
 * Each segment (split on &&, ||, ;, newline) must start with one of these prefixes (case-insensitive).
 * Narrow on purpose: extend when new checklist commands appear.
 */
export const ALLOWED_COMMAND_PREFIXES = [
  "git ",
  "gh ",
  "mkdir ",
  "cp ",
  "echo ",
] as const;

export type OutputChunk = { type: "stdout" | "stderr"; data: string };

/**
 * Split on &&, ||, ;, or newlines outside of quoted regions (double or single).
 * Keeps `gh ... --body "a;b"` as one segment.
 */
export function splitCommandSegments(command: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inDouble = false;
  let inSingle = false;
  let i = 0;

  const pushCurrent = () => {
    const t = current.trim();
    if (t.length > 0) segments.push(t);
    current = "";
  };

  while (i < command.length) {
    const c = command[i];

    if (c === "\\" && (inDouble || inSingle) && i + 1 < command.length) {
      current += c + command[i + 1];
      i += 2;
      continue;
    }

    if (c === '"' && !inSingle) {
      inDouble = !inDouble;
      current += c;
      i++;
      continue;
    }
    if (c === "'" && !inDouble) {
      inSingle = !inSingle;
      current += c;
      i++;
      continue;
    }

    if (!inDouble && !inSingle) {
      if (c === "\n") {
        pushCurrent();
        i++;
        continue;
      }
      if (c === ";") {
        pushCurrent();
        i++;
        continue;
      }
      const rest = command.slice(i);
      if (rest.startsWith("&&")) {
        pushCurrent();
        i += 2;
        continue;
      }
      if (rest.startsWith("||")) {
        pushCurrent();
        i += 2;
        continue;
      }
    }

    current += c;
    i++;
  }

  pushCurrent();
  return segments;
}

export function assertCommandAllowed(command: string): void {
  const segments = splitCommandSegments(command);
  if (segments.length === 0) {
    throw new Error("Empty command");
  }
  for (const seg of segments) {
    const t = seg.toLowerCase();
    const ok = ALLOWED_COMMAND_PREFIXES.some((p) => t.startsWith(p));
    if (!ok) {
      const preview = seg.length > 100 ? `${seg.slice(0, 100)}…` : seg;
      throw new Error(
        `Command blocked by allowlist. Offending segment: ${preview}`,
      );
    }
  }
}

function appendCapped(target: { value: string }, chunk: string): void {
  if (target.value.length >= MAX_CAPTURED_OUTPUT_CHARS) return;
  const room = MAX_CAPTURED_OUTPUT_CHARS - target.value.length;
  target.value += chunk.slice(0, room);
}

export type RunShellCommandResult = {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number | null;
  timedOut?: boolean;
};

/**
 * Runs a shell command in `cwd`, streaming chunks via `onChunk`.
 * Enforces allowlist, timeout (SIGTERM), and captured output caps.
 */
export function runShellCommand(
  command: string,
  cwd: string,
  options: {
    onChunk: (chunk: OutputChunk) => void;
    timeoutMs?: number;
  },
): Promise<RunShellCommandResult> {
  assertCommandAllowed(command);
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;

  return new Promise((resolve) => {
    const stdoutBuf = { value: "" };
    const stderrBuf = { value: "" };
    let settled = false;

    const timerRef: { id: ReturnType<typeof setTimeout> | null } = { id: null };

    const finish = (result: RunShellCommandResult) => {
      if (settled) return;
      settled = true;
      if (timerRef.id !== null) clearTimeout(timerRef.id);
      resolve(result);
    };

    const child: ChildProcessWithoutNullStreams = spawn(command, {
      shell: true,
      cwd,
      windowsHide: true,
    });

    timerRef.id = setTimeout(() => {
      child.kill("SIGTERM");
      finish({
        success: false,
        output: stdoutBuf.value,
        error:
          (stderrBuf.value ? `${stderrBuf.value}\n` : "") + "Command timed out",
        exitCode: null,
        timedOut: true,
      });
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      const s = data.toString();
      appendCapped(stdoutBuf, s);
      options.onChunk({ type: "stdout", data: s });
    });

    child.stderr.on("data", (data: Buffer) => {
      const s = data.toString();
      appendCapped(stderrBuf, s);
      options.onChunk({ type: "stderr", data: s });
    });

    child.on("close", (code) => {
      const success = code === 0;
      finish({
        success,
        output: stdoutBuf.value,
        error: stderrBuf.value || undefined,
        exitCode: code,
      });
    });

    child.on("error", (err) => {
      finish({
        success: false,
        output: stdoutBuf.value,
        error: err.message,
        exitCode: null,
      });
    });
  });
}
