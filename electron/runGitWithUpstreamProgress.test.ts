/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("./appFileLogger", () => ({
  writeAppLog: vi.fn(),
}));

import { spawn } from "node:child_process";
import {
  GitCommandError,
  runGitWithUpstreamProgress,
} from "./runGitWithUpstreamProgress";

describe("runGitWithUpstreamProgress", () => {
  const send = vi.fn();
  const webContents = { send };

  beforeEach(() => {
    send.mockClear();
    vi.mocked(spawn).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards stderr progress lines via upstream-status and resolves on exit 0", async () => {
    const stderr = new EventEmitter();
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = stderr;

    vi.mocked(spawn).mockReturnValue(
      child as ReturnType<typeof spawn>,
    );

    const p = runGitWithUpstreamProgress(webContents, [
      "pull",
      "--progress",
    ], { cwd: "/tmp/repo" });

    stderr.emit("data", Buffer.from("Receiving objects:  33%\n"));
    child.emit("close", 0, null);

    await expect(p).resolves.toBeUndefined();

    expect(spawn).toHaveBeenCalledWith(
      "git",
      ["pull", "--progress"],
      { cwd: "/tmp/repo", windowsHide: true },
    );
    expect(send).toHaveBeenCalledWith(
      "upstream-status",
      expect.objectContaining({
        message: expect.stringContaining("Receiving objects"),
        percent: 33,
      }),
    );
  });

  it("rejects with GitCommandError when git exits non-zero", async () => {
    const stderr = new EventEmitter();
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = stderr;
    vi.mocked(spawn).mockReturnValue(
      child as ReturnType<typeof spawn>,
    );

    const p = runGitWithUpstreamProgress(webContents, ["status"], {});
    stderr.emit("data", Buffer.from("fatal: Authentication failed\n"));
    child.emit("close", 1, null);

    const err = await p.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GitCommandError);
    expect((err as GitCommandError).message).toMatch(/exited with code 1/);
    expect((err as GitCommandError).stderr).toContain("Authentication failed");
  });

  it("flushes trailing stderr without newline on close", async () => {
    const stderr = new EventEmitter();
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = stderr;
    vi.mocked(spawn).mockReturnValue(
      child as ReturnType<typeof spawn>,
    );

    const p = runGitWithUpstreamProgress(webContents, ["clone", "--progress"], {});
    stderr.emit("data", Buffer.from("Resolving deltas:  88%"));
    child.emit("close", 0, null);

    await expect(p).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledWith(
      "upstream-status",
      expect.objectContaining({ percent: 88 }),
    );
  });

  it("rejects when process ends with a signal", async () => {
    const stderr = new EventEmitter();
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = stderr;
    vi.mocked(spawn).mockReturnValue(
      child as ReturnType<typeof spawn>,
    );

    const p = runGitWithUpstreamProgress(webContents, ["pull"], {});
    child.emit("close", null, "SIGTERM");

    await expect(p).rejects.toThrow(/SIGTERM/);
  });

  it("rejects on spawn error", async () => {
    const stderr = new EventEmitter();
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = stderr;
    vi.mocked(spawn).mockReturnValue(
      child as ReturnType<typeof spawn>,
    );

    const p = runGitWithUpstreamProgress(webContents, ["pull"], {});
    child.emit("error", new Error("ENOENT"));

    await expect(p).rejects.toThrow("ENOENT");
  });
});
