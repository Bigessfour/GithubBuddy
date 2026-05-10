/**
 * Trusted-student-tool execution: spawn without a shell, allowlist, pipeline
 * semantics (&& / || / ; / newline), caps, and timeout.
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

const ALLOWED_BINARIES = new Set(
  ALLOWED_COMMAND_PREFIXES.map((p) => p.trimEnd().toLowerCase()),
);

export type OutputChunk = { type: "stdout" | "stderr"; data: string };

/** How a segment is chained to the next (null = last segment). */
export type PipelineSeparator = "&&" | "||" | ";" | "newline";

export type PipelineStep = {
  segment: string;
  next: PipelineSeparator | null;
};

/**
 * Split on &&, ||, ;, or newlines outside of quoted regions (double or single).
 * Records the operator after each segment for shell-like short-circuit behavior.
 */
export function parseCommandPipeline(command: string): PipelineStep[] {
  const steps: PipelineStep[] = [];
  let current = "";
  let inDouble = false;
  let inSingle = false;
  let i = 0;

  const pushCurrent = (next: PipelineSeparator | null) => {
    const t = current.trim();
    if (t.length > 0) steps.push({ segment: t, next });
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
        pushCurrent("newline");
        i++;
        continue;
      }
      if (c === ";") {
        pushCurrent(";");
        i++;
        continue;
      }
      const rest = command.slice(i);
      if (rest.startsWith("&&")) {
        pushCurrent("&&");
        i += 2;
        continue;
      }
      if (rest.startsWith("||")) {
        pushCurrent("||");
        i += 2;
        continue;
      }
    }

    current += c;
    i++;
  }

  pushCurrent(null);
  return steps;
}

/**
 * Split on &&, ||, ;, or newlines outside of quoted regions (double or single).
 * Keeps `gh ... --body "a;b"` as one segment.
 */
export function splitCommandSegments(command: string): string[] {
  return parseCommandPipeline(command).map((p) => p.segment);
}

/**
 * Parse one pipeline segment into argv (POSIX-like quoting). Does not invoke a shell.
 */
export function parseShellArgv(segment: string): string[] {
  const args: string[] = [];
  let i = 0;
  const input = segment;
  const len = input.length;

  const skipSpace = () => {
    while (i < len && /\s/.test(input[i]!)) i++;
  };

  while (i < len) {
    skipSpace();
    if (i >= len) break;

    const c = input[i]!;

    if (c === '"') {
      i++;
      let s = "";
      while (i < len) {
        if (input[i] === "\\" && i + 1 < len) {
          s += input[i + 1]!;
          i += 2;
          continue;
        }
        if (input[i] === '"') {
          i++;
          break;
        }
        s += input[i]!;
        i++;
      }
      args.push(s);
      continue;
    }

    if (c === "'") {
      i++;
      let s = "";
      while (i < len) {
        if (input[i] === "'") {
          i++;
          break;
        }
        s += input[i]!;
        i++;
      }
      args.push(s);
      continue;
    }

    let s = "";
    while (i < len && !/\s/.test(input[i]!)) {
      s += input[i]!;
      i++;
    }
    args.push(s);
  }

  return args;
}

export function isAllowedBinary(name: string): boolean {
  return ALLOWED_BINARIES.has(name.toLowerCase());
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

function runOneSpawn(
  file: string,
  args: string[],
  cwd: string,
  stdoutBuf: { value: string },
  stderrBuf: { value: string },
  onChunk: (chunk: OutputChunk) => void,
  onSpawn: (child: ChildProcessWithoutNullStreams) => void,
): Promise<{ exitCode: number | null }> {
  return new Promise((resolve) => {
    const child: ChildProcessWithoutNullStreams = spawn(file, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });
    onSpawn(child);

    child.stdout.on("data", (data: Buffer) => {
      const s = data.toString();
      appendCapped(stdoutBuf, s);
      onChunk({ type: "stdout", data: s });
    });

    child.stderr.on("data", (data: Buffer) => {
      const s = data.toString();
      appendCapped(stderrBuf, s);
      onChunk({ type: "stderr", data: s });
    });

    child.on("close", (code) => {
      resolve({ exitCode: code });
    });

    child.on("error", (err) => {
      const msg = err.message;
      appendCapped(stderrBuf, msg);
      onChunk({ type: "stderr", data: msg });
      resolve({ exitCode: null });
    });
  });
}

/**
 * Runs an allowlisted command in `cwd` without `shell: true`, streaming chunks via `onChunk`.
 * Chained segments use `&&`, `||`, `;`, and newline like a shell (newline and `;` always continue).
 *
 * Throws synchronously if the command fails the allowlist (so callers can use try/catch or `.catch`).
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
  return runShellCommandPipeline(command, cwd, options);
}

async function runShellCommandPipeline(
  command: string,
  cwd: string,
  options: {
    onChunk: (chunk: OutputChunk) => void;
    timeoutMs?: number;
  },
): Promise<RunShellCommandResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
  const steps = parseCommandPipeline(command);

  const stdoutBuf = { value: "" };
  const stderrBuf = { value: "" };

  let activeChild: ChildProcessWithoutNullStreams | null = null;
  let timedOutFlag = false;

  const killTimer = setTimeout(() => {
    timedOutFlag = true;
    activeChild?.kill("SIGTERM");
  }, timeoutMs);

  const clearKillTimer = () => {
    clearTimeout(killTimer);
  };

  try {
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const { segment, next } = steps[stepIndex]!;
      const argv = parseShellArgv(segment);
      if (argv.length === 0) continue;

      const bin = argv[0]!;
      if (!isAllowedBinary(bin)) {
        throw new Error(
          `Command blocked by allowlist. Disallowed program: ${bin}`,
        );
      }

      const result = await runOneSpawn(
        bin,
        argv.slice(1),
        cwd,
        stdoutBuf,
        stderrBuf,
        options.onChunk,
        (c) => {
          activeChild = c;
        },
      );
      activeChild = null;

      if (timedOutFlag) {
        return {
          success: false,
          output: stdoutBuf.value,
          error:
            (stderrBuf.value ? `${stderrBuf.value}\n` : "") + "Command timed out",
          exitCode: null,
          timedOut: true,
        };
      }

      const code = result.exitCode;
      const success = code === 0;

      if (next === null) {
        return {
          success,
          output: stdoutBuf.value,
          error: stderrBuf.value || undefined,
          exitCode: code,
        };
      }
      if (next === "&&" && code !== 0) {
        return {
          success: false,
          output: stdoutBuf.value,
          error: stderrBuf.value || undefined,
          exitCode: code,
        };
      }
      if (next === "||" && code === 0) {
        return {
          success: true,
          output: stdoutBuf.value,
          error: stderrBuf.value || undefined,
          exitCode: code,
        };
      }
    }

    return {
      success: true,
      output: stdoutBuf.value,
      error: stderrBuf.value || undefined,
      exitCode: 0,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      output: stdoutBuf.value,
      error: message,
      exitCode: null,
    };
  } finally {
    clearKillTimer();
  }
}
