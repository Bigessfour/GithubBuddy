/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import {
  assertCommandAllowed,
  splitCommandSegments,
  parseCommandPipeline,
  parseShellArgv,
  runShellCommand,
} from "./runShellCommand";

vi.mock("child_process", () => {
  return {
    spawn: vi.fn(),
  };
});

import { spawn } from "child_process";

function mockChild() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const child = Object.assign(new EventEmitter(), {
    stdout,
    stderr,
    kill: vi.fn(),
  });
  return { child, stdout, stderr };
}

describe("parseCommandPipeline", () => {
  it("records && between segments", () => {
    expect(parseCommandPipeline("git a && git b")).toEqual([
      { segment: "git a", next: "&&" },
      { segment: "git b", next: null },
    ]);
  });

  it("treats newline like ; for sequencing metadata", () => {
    expect(parseCommandPipeline("git a\ngit b")).toEqual([
      { segment: "git a", next: "newline" },
      { segment: "git b", next: null },
    ]);
  });
});

describe("parseShellArgv", () => {
  it("splits unquoted tokens", () => {
    expect(parseShellArgv("git status")).toEqual(["git", "status"]);
  });

  it("keeps semicolons inside double-quoted -m value as one argument", () => {
    expect(parseShellArgv('git commit -m "x; rm -rf /"')).toEqual([
      "git",
      "commit",
      "-m",
      "x; rm -rf /",
    ]);
  });
});

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
    const { child, stdout } = mockChild();

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
    expect(spawn).toHaveBeenCalledWith("git", ["status"], {
      shell: false,
      cwd: "/tmp",
      windowsHide: true,
    });
  });

  it("uses argv array for quoted git commit (no shell)", async () => {
    const { child, stdout } = mockChild();
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);

    const cmd = 'git commit -m "Complete week 2 day 4 challenge 1"';
    const p = runShellCommand(cmd, "/repo", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    stdout.emit("data", Buffer.from("ok"));
    child.emit("close", 0);
    await p;

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith(
      "git",
      ["commit", "-m", "Complete week 2 day 4 challenge 1"],
      { shell: false, cwd: "/repo", windowsHide: true },
    );
  });

  it("runs chained && as two spawns (semicolon in quoted string does not add spawn)", async () => {
    const a = mockChild();
    const b = mockChild();
    vi.mocked(spawn)
      .mockReturnValueOnce(a.child as ReturnType<typeof spawn>)
      .mockReturnValueOnce(b.child as ReturnType<typeof spawn>);

    const p = runShellCommand('git status && git commit -m "x; y"', "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });

    a.child.emit("close", 0);
    await Promise.resolve();
    b.child.emit("close", 0);
    await p;

    expect(spawn).toHaveBeenCalledTimes(2);
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "git",
      ["status"],
      expect.objectContaining({ shell: false, cwd: "/tmp" }),
    );
    expect(spawn).toHaveBeenNthCalledWith(2, "git", ["commit", "-m", "x; y"], {
      shell: false,
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
    const { child, stderr } = mockChild();
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
    const { child } = mockChild();
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
    const { child } = mockChild();
    vi.mocked(spawn).mockReturnValue(child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status", "/tmp", {
      onChunk: () => {},
      timeoutMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(child.kill).toHaveBeenCalled();
    child.emit("close", null);
    const result = await p;
    expect(result.timedOut).toBe(true);
    vi.useRealTimers();
  });

  it("caps accumulated stdout", async () => {
    const { child, stdout } = mockChild();
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

  it("stops on && when first segment fails", async () => {
    const a = mockChild();
    vi.mocked(spawn).mockReturnValue(a.child as ReturnType<typeof spawn>);

    const p = runShellCommand("git status && git pull", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    a.child.emit("close", 1);
    const result = await p;
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("|| stops after first segment when it succeeds", async () => {
    const a = mockChild();
    vi.mocked(spawn).mockReturnValue(a.child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status || git branch", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    a.child.emit("close", 0);
    const result = await p;
    expect(result.success).toBe(true);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("|| runs second segment when first fails", async () => {
    const a = mockChild();
    const b = mockChild();
    vi.mocked(spawn)
      .mockReturnValueOnce(a.child as ReturnType<typeof spawn>)
      .mockReturnValueOnce(b.child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status || git branch", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    a.child.emit("close", 1);
    await Promise.resolve();
    b.child.emit("close", 0);
    const result = await p;
    expect(result.success).toBe(true);
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it("runs both segments for ; separator", async () => {
    const a = mockChild();
    const b = mockChild();
    vi.mocked(spawn)
      .mockReturnValueOnce(a.child as ReturnType<typeof spawn>)
      .mockReturnValueOnce(b.child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status; git log", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    a.child.emit("close", 0);
    await Promise.resolve();
    b.child.emit("close", 0);
    const result = await p;
    expect(result.success).toBe(true);
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(result.exitCode).toBe(0);
  });

  it("runs both segments separated by newline", async () => {
    const a = mockChild();
    const b = mockChild();
    vi.mocked(spawn)
      .mockReturnValueOnce(a.child as ReturnType<typeof spawn>)
      .mockReturnValueOnce(b.child as ReturnType<typeof spawn>);
    const p = runShellCommand("git status\ngit log", "/tmp", {
      onChunk: () => {},
      timeoutMs: 5000,
    });
    a.child.emit("close", 0);
    await Promise.resolve();
    b.child.emit("close", 1);
    const result = await p;
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(result.exitCode).toBe(1);
    expect(result.success).toBe(false);
  });

});
