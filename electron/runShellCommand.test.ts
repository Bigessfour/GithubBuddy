/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import {
  assertCommandAllowed,
  splitCommandSegments,
  runShellCommand,
} from "./runShellCommand";

vi.mock("child_process", () => {
  return {
    spawn: vi.fn(),
  };
});

import { spawn } from "child_process";

describe("splitCommandSegments", () => {
  it("splits on && outside quotes", () => {
    expect(splitCommandSegments("git status && git pull")).toEqual([
      "git status",
      "git pull",
    ]);
  });

  it("splits on newlines, ||, and bare semicolons", () => {
    expect(splitCommandSegments("git a\ngit b")).toEqual(["git a", "git b"]);
    expect(splitCommandSegments("git a||git b")).toEqual(["git a", "git b"]);
    expect(splitCommandSegments("git a;git b")).toEqual(["git a", "git b"]);
  });

  it("does not split semicolons inside double quotes", () => {
    const cmd = 'gh pr create --body "a;b"';
    expect(splitCommandSegments(cmd)).toEqual([cmd]);
  });

  it("does not split semicolons inside single quotes", () => {
    expect(splitCommandSegments("echo 'a;b' && git status")).toEqual([
      "echo 'a;b'",
      "git status",
    ]);
  });

  it("splits on semicolon outside quotes", () => {
    expect(splitCommandSegments("git status; git log")).toEqual([
      "git status",
      "git log",
    ]);
  });

  it("preserves backslash-escaped pairs inside quoted regions", () => {
    expect(splitCommandSegments('echo "a\\b" && git status')).toEqual([
      'echo "a\\b"',
      "git status",
    ]);
  });
});

describe("assertCommandAllowed", () => {
  it("allows git and gh chains", () => {
    expect(() =>
      assertCommandAllowed("git fetch upstream && git checkout main"),
    ).not.toThrow();
  });

  it("blocks disallowed commands", () => {
    expect(() => assertCommandAllowed("curl http://evil")).toThrow(/allowlist/);
  });

  it("truncates long offending segment in error message", () => {
    const long = "nope" + "z".repeat(120);
    expect(() => assertCommandAllowed(long)).toThrow(/…/);
  });

  it("rejects empty command", () => {
    expect(() => assertCommandAllowed("")).toThrow(/Empty command/);
  });
});

describe("runShellCommand", () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
  });

  it("streams stdout and resolves on close", async () => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      kill: vi.fn(),
    });

    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);

    const chunks: string[] = [];
    const p = runShellCommand("git status", "/tmp", {
      onChunk: (c) => chunks.push(`${c.type}:${c.data}`),
      timeoutMs: 5000,
    });

    stdout.emit("data", Buffer.from("ok\n"));
    child.emit("close", 0);

    const result = await p;
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(chunks).toContain("stdout:ok\n");
    expect(spawn).toHaveBeenCalledWith("git status", {
      shell: true,
      cwd: "/tmp",
      windowsHide: true,
    });
  });

  it("throws before spawn when allowlist fails", () => {
    expect(() => {
      void runShellCommand("rm -rf /", "/tmp", { onChunk: () => {} });
    }).toThrow(/allowlist/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it("streams stderr and non-zero exit", async () => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      kill: vi.fn(),
    });
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
    const chunks: string[] = [];
    const p = runShellCommand("git status", "/tmp", {
      onChunk: (c) => chunks.push(`${c.type}:${c.data}`),
      timeoutMs: 5000,
    });
    stderr.emit("data", Buffer.from("warn"));
    child.emit("close", 2);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(2);
    expect(chunks.some((c) => c.startsWith("stderr:"))).toBe(true);
  });

  it("handles child error event", async () => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      kill: vi.fn(),
    });
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    child.emit("error", new Error("spawn failed"));
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/spawn failed/);
  });

  it("times out when process never exits", async () => {
    vi.useFakeTimers();
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      kill: vi.fn(),
    });
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status", "/tmp", {
      onChunk: () => {},
      timeoutMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await p;
    expect(result.timedOut).toBe(true);
    expect(child.kill).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("caps accumulated stdout", async () => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      kill: vi.fn(),
    });
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
    const big = "x".repeat(60_000);
    const p = runShellCommand("git status", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    stdout.emit("data", Buffer.from(big));
    stdout.emit("data", Buffer.from(big));
    child.emit("close", 0);
    const result = await p;
    expect(result.output.length).toBeLessThanOrEqual(100_000);
  });
});
