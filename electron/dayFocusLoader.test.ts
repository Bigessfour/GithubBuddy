/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./reportToMainLog", () => ({
  reportToMainLog: vi.fn(),
}));

vi.mock("./projectRoot", () => ({
  getAppProjectRoot: () => "/pc-root",
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
import { reportToMainLog } from "./reportToMainLog";
import { loadDayFocusFromDisk } from "./dayFocusLoader";

describe("loadDayFocusFromDisk", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when day folder missing", () => {
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    expect(loadDayFocusFromDisk(2, 1)).toBeNull();
  });

  it("returns null when path is not a directory", () => {
    vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
      const s = String(dir).replace(/\\/g, "/");
      if (s.endsWith("aico-echo")) {
        return [{ name: "week2", isDirectory: () => true } as fs.Dirent];
      }
      if (s.endsWith("week2")) {
        return [{ name: "day1", isDirectory: () => true } as fs.Dirent];
      }
      return [];
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);
    expect(loadDayFocusFromDisk(2, 1)).toBeNull();
  });

  it("orders markdown files with priority list first", () => {
    vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
      const s = String(dir).replace(/\\/g, "/");
      if (s.endsWith("aico-echo")) {
        return [{ name: "week1", isDirectory: () => true } as fs.Dirent];
      }
      if (s.endsWith("week1")) {
        return [{ name: "day2", isDirectory: () => true } as fs.Dirent];
      }
      if (s.endsWith("day2")) {
        return [
          { name: "z.md", isFile: () => true } as fs.Dirent,
          { name: "lesson.md", isFile: () => true } as fs.Dirent,
          { name: "README.md", isFile: () => true } as fs.Dirent,
        ];
      }
      return [];
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
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
    vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
      const s = String(dir).replace(/\\/g, "/");
      if (s.endsWith("aico-echo")) {
        return [{ name: "week1", isDirectory: () => true } as fs.Dirent];
      }
      if (s.endsWith("week1")) {
        return [{ name: "day1", isDirectory: () => true } as fs.Dirent];
      }
      if (s.endsWith("day1")) {
        return [{ name: "lesson.md", isFile: () => true } as fs.Dirent];
      }
      return [];
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("io");
    });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadDayFocusFromDisk(1, 1)).toBeNull();
    expect(err).toHaveBeenCalled();
    expect(reportToMainLog).toHaveBeenCalledWith(
      "error",
      "dayFocusLoader",
      "Failed to load day focus content",
      expect.objectContaining({ week: 1, day: 1, error: "io" }),
    );
  });
});
