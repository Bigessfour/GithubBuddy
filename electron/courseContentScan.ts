/**
 * Synchronous filesystem scan for local course repo layout.
 * Imported only by preload — never by the Vite renderer bundle.
 *
 * Electron security model: Node APIs in preload/main, not in renderer.
 * https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

import fs from "node:fs";
import path from "node:path";
import { getAppProjectRoot } from "./projectRoot";
import { reportToMainLog } from "./reportToMainLog";

export type WeekDayInfo = { week: number; days: number[] };

/** Throttle identical warnings when the renderer re-scans frequently (dev). */
const lastEmptyLayoutLogAt = new Map<string, number>();
const EMPTY_LAYOUT_LOG_COOLDOWN_MS =
  process.env.VITEST === "true" ? 0 : 15_000;

export function scanCourseContentFromDisk(): {
  hasLocal: boolean;
  weeks: WeekDayInfo[];
} {
  const coursePath = path.join(
    getAppProjectRoot(),
    "data",
    "course-content",
    "aico-echo",
  );

  let hasLocal: boolean;
  try {
    hasLocal =
      fs.existsSync(coursePath) && fs.statSync(coursePath).isDirectory();
  } catch {
    return { hasLocal: false, weeks: [] };
  }

  if (!hasLocal) {
    return { hasLocal: false, weeks: [] };
  }

  try {
    const entries = fs.readdirSync(coursePath, { withFileTypes: true });

    const weeks = entries
      .filter((entry) => entry.isDirectory() && /^week\d+$/i.test(entry.name))
      .map((entry) => {
        const weekNum = parseInt(entry.name.replace(/^week/i, ""), 10);
        const weekPath = path.join(coursePath, entry.name);

        let days: number[] = [];
        try {
          const dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
          days = dayEntries
            .filter((d) => d.isDirectory() && /^day\d+$/i.test(d.name))
            .map((d) => parseInt(d.name.replace(/^day/i, ""), 10))
            .sort((a, b) => a - b);
        } catch {
          // ignore unreadable week folders
        }

        return { week: weekNum, days };
      })
      .filter((w) => w.days.length > 0)
      .sort((a, b) => a.week - b.week);

    if (weeks.length === 0) {
      const now = Date.now();
      const prev = lastEmptyLayoutLogAt.get(coursePath) ?? 0;
      if (now - prev >= EMPTY_LAYOUT_LOG_COOLDOWN_MS) {
        lastEmptyLayoutLogAt.set(coursePath, now);
        reportToMainLog(
          "warn",
          "courseContentScan",
          "Course folder exists but no week*/day* content was found",
          { coursePath },
        );
      }
    }

    return { hasLocal: true, weeks };
  } catch (error) {
    console.error(
      "[courseContentScan] Failed to scan course content directory:",
      error,
    );
    reportToMainLog(
      "error",
      "courseContentScan",
      "Failed to scan course content directory",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return { hasLocal: true, weeks: [] };
  }
}
