/**
 * Discover lesson folders inside an aico-echo clone (flexible names + one-level nesting).
 */

import fs from "node:fs";
import path from "node:path";
import { parseDayFolderName, parseWeekFolderName } from "./courseFolderNames";

export type WeekDayInfo = { week: number; days: number[] };

/** Enough for ModuleN/WeekN/DayN and a few extra segments. */
const MAX_LESSON_WALK_DEPTH = 16;

function mergeWeekDays(
  into: Map<number, Set<number>>,
  weeks: WeekDayInfo[],
): void {
  for (const { week, days } of weeks) {
    let set = into.get(week);
    if (!set) {
      set = new Set<number>();
      into.set(week, set);
    }
    for (const d of days) set.add(d);
  }
}

function weekDayInfoFromMap(map: Map<number, Set<number>>): WeekDayInfo[] {
  return [...map.entries()]
    .map(([week, days]) => ({
      week,
      days: [...days].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.week - b.week);
}

/**
 * Walk the repo for nested layouts (e.g. Module01/Week02-topic/Day1-lab), not only flat weekN/dayN.
 */
export function collectWeekDayLayoutDeep(courseRepoRoot: string): WeekDayInfo[] {
  const map = new Map<number, Set<number>>();

  const visit = (dir: string, depth: number): void => {
    if (depth > MAX_LESSON_WALK_DEPTH) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      const weekNum = parseWeekFolderName(entry.name);
      if (weekNum !== null) {
        try {
          const dayEntries = fs.readdirSync(full, { withFileTypes: true });
          for (const d of dayEntries) {
            if (!d.isDirectory()) continue;
            const dayNum = parseDayFolderName(d.name);
            if (dayNum === null) continue;
            let set = map.get(weekNum);
            if (!set) {
              set = new Set<number>();
              map.set(weekNum, set);
            }
            set.add(dayNum);
          }
        } catch {
          /* unreadable week folder */
        }
        continue;
      }
      visit(full, depth + 1);
    }
  };

  visit(courseRepoRoot, 0);
  return weekDayInfoFromMap(map);
}

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

  const subMerged = new Map<number, Set<number>>();
  let subsWithLessons = 0;
  let firstSubWithLessons: string | null = null;
  try {
    const entries = fs.readdirSync(courseRepoRoot, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const sub = path.join(courseRepoRoot, e.name);
      weeks = scanWeekDayTree(sub);
      if (weeks.length > 0) {
        mergeWeekDays(subMerged, weeks);
        subsWithLessons++;
        if (!firstSubWithLessons) firstSubWithLessons = sub;
      }
    }
  } catch {
    /* ignore */
  }

  if (subMerged.size > 0) {
    return {
      lessonRoot:
        subsWithLessons === 1 && firstSubWithLessons
          ? firstSubWithLessons
          : courseRepoRoot,
      weeks: weekDayInfoFromMap(subMerged),
    };
  }

  const deepWeeks = collectWeekDayLayoutDeep(courseRepoRoot);
  return { lessonRoot: courseRepoRoot, weeks: deepWeeks };
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
  let found: string | null = null;
  const visit = (dir: string, depth: number): void => {
    if (found !== null || depth > MAX_LESSON_WALK_DEPTH) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (parseWeekFolderName(entry.name) === week) {
        try {
          const dayEntries = fs.readdirSync(full, { withFileTypes: true });
          for (const d of dayEntries) {
            if (!d.isDirectory()) continue;
            if (parseDayFolderName(d.name) === day) {
              found = path.join(full, d.name);
              return;
            }
          }
        } catch {
          /* skip */
        }
        continue;
      }
      visit(full, depth + 1);
    }
  };
  visit(courseRepoRoot, 0);
  return found;
}
