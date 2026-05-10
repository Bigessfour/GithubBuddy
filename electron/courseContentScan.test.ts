/**
 * @vitest-environment node
 */
import path from "node:path";
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
  },
}));

import fs from "node:fs";
import { reportToMainLog } from "./reportToMainLog";
import { scanCourseContentFromDisk } from "./courseContentScan";

describe("scanCourseContentFromDisk", () => {
  beforeEach(() => {
    vi.mocked(reportToMainLog).mockClear();
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty when course path missing", () => {
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: false, weeks: [] });
  });

  it("returns empty when path exists but is not a directory", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: false, weeks: [] });
  });

  it("returns sorted weeks and days when layout is valid", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync)
      .mockReturnValueOnce([
        { name: "week10", isDirectory: () => true } as fs.Dirent,
        { name: "week2", isDirectory: () => true } as fs.Dirent,
        { name: "readme", isDirectory: () => false } as fs.Dirent,
      ])
      .mockReturnValueOnce([
        { name: "day1", isDirectory: () => true } as fs.Dirent,
      ])
      .mockReturnValueOnce([
        { name: "day3", isDirectory: () => true } as fs.Dirent,
        { name: "day1", isDirectory: () => true } as fs.Dirent,
      ]);

    expect(scanCourseContentFromDisk()).toEqual({
      hasLocal: true,
      weeks: [
        { week: 2, days: [1, 3] },
        { week: 10, days: [1] },
      ],
    });
    expect(reportToMainLog).not.toHaveBeenCalled();
  });

  it("returns empty when existsSync throws", () => {
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error("eacces");
    });
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: false, weeks: [] });
  });

  it("returns empty weeks when readdir throws (treated as empty layout, not a fatal scan)", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error("io");
    });
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: true, weeks: [] });
    expect(reportToMainLog).toHaveBeenCalledWith(
      "warn",
      "courseContentScan",
      "Course folder exists but no recognizable week*/day* lesson folders were found",
      expect.objectContaining({
        coursePath: expect.any(String),
        lessonRoot: expect.any(String),
      }),
    );
  });

  it("skips week folders that fail to read", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync)
      .mockReturnValueOnce([
        { name: "week1", isDirectory: () => true } as fs.Dirent,
      ])
      .mockImplementation(() => {
        throw new Error("bad week");
      });
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: true, weeks: [] });
    expect(reportToMainLog).toHaveBeenCalledWith(
      "warn",
      "courseContentScan",
      "Course folder exists but no recognizable week*/day* lesson folders were found",
      expect.objectContaining({
        coursePath: expect.any(String),
        lessonRoot: expect.any(String),
      }),
    );
  });

  it("warns when course exists but no week folders have day content", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync)
      .mockReturnValueOnce([
        { name: "week1", isDirectory: () => true } as fs.Dirent,
      ])
      .mockReturnValueOnce([
        { name: "notes.txt", isDirectory: () => false } as fs.Dirent,
      ]);
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: true, weeks: [] });
    expect(reportToMainLog).toHaveBeenCalledWith(
      "warn",
      "courseContentScan",
      "Course folder exists but no recognizable week*/day* lesson folders were found",
      expect.objectContaining({
        coursePath: expect.any(String),
        lessonRoot: expect.any(String),
      }),
    );
  });

  it("accepts week-1 / day-2 style folder names", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync)
      .mockReturnValueOnce([
        { name: "week-1", isDirectory: () => true } as fs.Dirent,
      ])
      .mockReturnValueOnce([
        { name: "day-2", isDirectory: () => true } as fs.Dirent,
      ]);

    expect(scanCourseContentFromDisk()).toEqual({
      hasLocal: true,
      weeks: [{ week: 1, days: [2] }],
    });
  });

  it("discovers lessons under an immediate subfolder (e.g. curriculum/)", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const repo = path.join("/pc-root", "data", "course-content", "aico-echo");
    const curriculum = path.join(repo, "curriculum");
    const week1 = path.join(curriculum, "week1");
    vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
      const s = path.normalize(String(dir));
      if (s === path.normalize(repo)) {
        return [
          { name: "README.md", isDirectory: () => false } as fs.Dirent,
          { name: "curriculum", isDirectory: () => true } as fs.Dirent,
        ];
      }
      if (s === path.normalize(curriculum)) {
        return [{ name: "week1", isDirectory: () => true } as fs.Dirent];
      }
      if (s === path.normalize(week1)) {
        return [{ name: "day1", isDirectory: () => true } as fs.Dirent];
      }
      return [];
    });

    expect(scanCourseContentFromDisk()).toEqual({
      hasLocal: true,
      weeks: [{ week: 1, days: [1] }],
    });
  });
});
