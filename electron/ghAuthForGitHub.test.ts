/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
  spawnSync: vi.fn(),
}));

import { spawn, spawnSync } from "node:child_process";
import {
  ghApiRepoCheck,
  isGhAvailable,
  runGhAuthLoginWeb,
  runGhAuthSetupGit,
} from "./ghAuthForGitHub";

function mockSpawnClosingWith(
  code: number | null,
  opts: { stderr?: string; stdout?: string } = {},
): void {
  const stderr = opts.stderr ?? "";
  const stdout = opts.stdout ?? "";
  vi.mocked(spawn).mockImplementation(() => {
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    queueMicrotask(() => {
      if (stdout) child.stdout.emit("data", Buffer.from(stdout));
      if (stderr) child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", code);
    });
    return child as ReturnType<typeof spawn>;
  });
}

describe("ghAuthForGitHub", () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
    vi.mocked(spawnSync).mockReset();
  });

  it("isGhAvailable is true when gh --version exits 0", () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: "gh version 2.0.0\n",
      stderr: "",
      output: [],
      signal: null,
      error: undefined,
    } as ReturnType<typeof spawnSync>);
    expect(isGhAvailable()).toBe(true);
    expect(spawnSync).toHaveBeenCalledWith(
      "gh",
      ["--version"],
      expect.objectContaining({ windowsHide: true }),
    );
  });

  it("isGhAvailable is false on non-zero status", () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 127,
      stdout: "",
      stderr: "",
      output: [],
      signal: null,
      error: undefined,
    } as ReturnType<typeof spawnSync>);
    expect(isGhAvailable()).toBe(false);
  });

  it("runGhAuthLoginWeb resolves ok on exit 0", async () => {
    mockSpawnClosingWith(0);
    await expect(runGhAuthLoginWeb()).resolves.toEqual({ ok: true });
    expect(spawn).toHaveBeenCalledWith(
      "gh",
      ["auth", "login", "-h", "github.com", "-p", "https", "-w"],
      expect.any(Object),
    );
  });

  it("runGhAuthLoginWeb returns error detail on non-zero exit", async () => {
    mockSpawnClosingWith(1, { stderr: "denied\n" });
    await expect(runGhAuthLoginWeb()).resolves.toEqual({
      ok: false,
      error: "denied",
    });
  });

  it("runGhAuthSetupGit throws when gh exits non-zero", async () => {
    mockSpawnClosingWith(1, { stderr: "nope" });
    await expect(runGhAuthSetupGit()).rejects.toThrow(/nope/);
  });

  it("runGhAuthSetupGit resolves on exit 0", async () => {
    mockSpawnClosingWith(0);
    await expect(runGhAuthSetupGit()).resolves.toBeUndefined();
  });

  it("ghApiRepoCheck returns ok on exit 0", async () => {
    mockSpawnClosingWith(0, { stdout: "12345\n" });
    await expect(ghApiRepoCheck("o", "r")).resolves.toBe("ok");
  });

  it("ghApiRepoCheck returns not_found on 404-like output", async () => {
    mockSpawnClosingWith(1, {
      stderr: "HTTP 404: Not Found",
    });
    await expect(ghApiRepoCheck("o", "r")).resolves.toBe("not_found");
  });

  it("ghApiRepoCheck returns error on other failures", async () => {
    mockSpawnClosingWith(1, {
      stderr: "HTTP 500",
    });
    await expect(ghApiRepoCheck("o", "r")).resolves.toBe("error");
  });
});
