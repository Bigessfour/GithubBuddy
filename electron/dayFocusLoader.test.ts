/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./reportToMainLog", () => ({
  reportToMainLog: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

import fs from "node:fs";
import { loadDayFocusFromDisk } from "./dayFocusLoader";

describe("loadDayFocusFromDisk", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when day folder missing", () => {
    expect(loadDayFocusFromDisk(2, 1)).toBeNull();
  });

  it("returns null when path is not a directory", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);
    expect(loadDayFocusFromDisk(2, 1)).toBeNull();
  });

  it("orders markdown files with priority list first", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: "z.md", isFile: () => true } as fs.Dirent,
      { name: "lesson.md", isFile: () => true } as fs.Dirent,
      { name: "README.md", isFile: () => true } as fs.Dirent,
    ]);
    vi.mocked(fs.readFileSync).mockImplementation(
      (p: fs.PathOrFileDescriptor) => {
        if (String(p).endsWith("README.md")) return "R";
        if (String(p).endsWith("lesson.md")) return "L";
        return "Z";
      },
    );

    const result = loadDayFocusFromDisk(1, 2);
    expect(result?.files.map((f) => f.name)).toEqual([
      "README.md",
      "lesson.md",
      "z.md",
    ]);
    expect(result?.files[0].content).toBe("R");
  });

  it("returns null when read fails", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error("io");
    });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadDayFocusFromDisk(1, 1)).toBeNull();
    expect(err).toHaveBeenCalled();
  });
});
