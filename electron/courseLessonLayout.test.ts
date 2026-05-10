/**
 * @vitest-environment node
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  collectWeekDayLayoutDeep,
  resolveDayFocusDir,
  resolveLessonScan,
} from "./courseLessonLayout";

describe("courseLessonLayout", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots) {
      fs.rmSync(r, { recursive: true, force: true });
    }
    roots.length = 0;
  });

  function makeTempCourse(
    mk: (root: string) => void,
  ): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pc-course-"));
    roots.push(root);
    mk(root);
    return root;
  }

  it("collectWeekDayLayoutDeep merges nested Module/Week/Day trees", () => {
    const root = makeTempCourse((r) => {
      fs.mkdirSync(
        path.join(r, "Module01-X", "Week02-Topic", "Day1-A"),
        { recursive: true },
      );
      fs.mkdirSync(
        path.join(r, "Module02-Y", "Week03-Z", "Day02-B"),
        { recursive: true },
      );
    });
    expect(collectWeekDayLayoutDeep(root)).toEqual([
      { week: 2, days: [1] },
      { week: 3, days: [2] },
    ]);
  });

  it("resolveLessonScan uses a lone submodule folder as lesson root", () => {
    const root = makeTempCourse((r) => {
      fs.mkdirSync(
        path.join(r, "Module01", "Week01-Intro", "Day01"),
        { recursive: true },
      );
    });
    const modulePath = path.join(root, "Module01");
    expect(resolveLessonScan(root)).toEqual({
      lessonRoot: modulePath,
      weeks: [{ week: 1, days: [1] }],
    });
  });

  it("resolveLessonScan merges weeks from every immediate module-style subfolder", () => {
    const root = makeTempCourse((r) => {
      fs.mkdirSync(path.join(r, "M1", "Week01-A", "Day1"), { recursive: true });
      fs.mkdirSync(path.join(r, "M2", "Week02-B", "Day1"), { recursive: true });
    });
    expect(resolveLessonScan(root)).toEqual({
      lessonRoot: root,
      weeks: [
        { week: 1, days: [1] },
        { week: 2, days: [1] },
      ],
    });
  });

  it("resolveDayFocusDir finds day folder nested under modules", () => {
    const root = makeTempCourse((r) => {
      fs.mkdirSync(
        path.join(r, "Module01-Systems", "Week02-DB", "Day3-Flask", "lessons"),
        { recursive: true },
      );
    });
    const dayPath = path.join(
      root,
      "Module01-Systems",
      "Week02-DB",
      "Day3-Flask",
    );
    expect(resolveDayFocusDir(root, 2, 3)).toBe(dayPath);
  });
});
