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
import { resolveLessonScan } from "./courseLessonLayout";

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
    const { lessonRoot, weeks } = resolveLessonScan(coursePath);

    if (weeks.length === 0) {
      const now = Date.now();
      const prev = lastEmptyLayoutLogAt.get(coursePath) ?? 0;
      if (now - prev >= EMPTY_LAYOUT_LOG_COOLDOWN_MS) {
        lastEmptyLayoutLogAt.set(coursePath, now);
        reportToMainLog(
          "warn",
          "courseContentScan",
          "Course folder exists but no recognizable week*/day* lesson folders were found",
          { coursePath, lessonRoot },
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
