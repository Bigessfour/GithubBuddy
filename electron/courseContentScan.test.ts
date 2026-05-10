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

  it("returns hasLocal true and empty weeks when top readdir throws", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error("io");
    });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(scanCourseContentFromDisk()).toEqual({ hasLocal: true, weeks: [] });
    expect(err).toHaveBeenCalled();
    expect(reportToMainLog).toHaveBeenCalledWith(
      "error",
      "courseContentScan",
      "Failed to scan course content directory",
      expect.objectContaining({ error: "io" }),
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
      "Course folder exists but no week*/day* content was found",
      expect.objectContaining({ coursePath: expect.any(String) }),
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
      "Course folder exists but no week*/day* content was found",
      expect.objectContaining({ coursePath: expect.any(String) }),
    );
  });
});
