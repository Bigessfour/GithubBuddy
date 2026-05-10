/**
 * Discover lesson folders inside an aico-echo clone (flexible names + one-level nesting).
 */

import fs from "node:fs";
import path from "node:path";
import { parseDayFolderName, parseWeekFolderName } from "./courseFolderNames";

export type WeekDayInfo = { week: number; days: number[] };

export function scanWeekDayTree(contentRoot: string): WeekDayInfo[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(contentRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const weeks = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const weekNum = parseWeekFolderName(entry.name);
      if (weekNum === null) return null;
      const weekPath = path.join(contentRoot, entry.name);
      let days: number[] = [];
      try {
        const dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
        days = dayEntries
          .filter((d) => d.isDirectory())
          .map((d) => parseDayFolderName(d.name))
          .filter((n): n is number => n !== null)
          .sort((a, b) => a - b);
      } catch {
        /* unreadable week folder */
      }
      return { week: weekNum, days };
    })
    .filter((w): w is WeekDayInfo => w !== null && w.days.length > 0)
    .sort((a, b) => a.week - b.week);

  return weeks;
}

/**
 * Find the directory that contains weekN/dayN lesson folders and return its tree in one pass
 * per candidate root (avoids re-scanning the same path after resolve — important for tests
 * and avoids redundant fs work).
 */
export function resolveLessonScan(courseRepoRoot: string): {
  lessonRoot: string;
  weeks: WeekDayInfo[];
} {
  let weeks = scanWeekDayTree(courseRepoRoot);
  if (weeks.length > 0) {
    return { lessonRoot: courseRepoRoot, weeks };
  }
  try {
    const entries = fs.readdirSync(courseRepoRoot, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const sub = path.join(courseRepoRoot, e.name);
      weeks = scanWeekDayTree(sub);
      if (weeks.length > 0) {
        return { lessonRoot: sub, weeks };
      }
    }
  } catch {
    /* ignore */
  }
  return { lessonRoot: courseRepoRoot, weeks: [] };
}

/** Repo root of aico-echo clone → directory that holds week folders. */
export function resolveLessonContentRoot(courseRepoRoot: string): string {
  return resolveLessonScan(courseRepoRoot).lessonRoot;
}

/** Absolute path to the day folder containing markdown, or null. */
export function resolveDayFocusDir(
  courseRepoRoot: string,
  week: number,
  day: number,
): string | null {
  const contentRoot = resolveLessonContentRoot(courseRepoRoot);
  let weekEntries: fs.Dirent[];
  try {
    weekEntries = fs.readdirSync(contentRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  const weekDir = weekEntries.find(
    (e) => e.isDirectory() && parseWeekFolderName(e.name) === week,
  );
  if (!weekDir) return null;
  const weekPath = path.join(contentRoot, weekDir.name);
  let dayEntries: fs.Dirent[];
  try {
    dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
  } catch {
    return null;
  }
  const dayDir = dayEntries.find(
    (e) => e.isDirectory() && parseDayFolderName(e.name) === day,
  );
  if (!dayDir) return null;
  return path.join(weekPath, dayDir.name);
}
