/**
 * Course Content Scanner
 *
 * This utility scans the local clone of the Code Platoon course repository
 * located at `data/course-content/aico-echo`.
 *
 * It discovers available weeks and days by reading the folder structure.
 * This makes the day selector dynamic and keeps the app in sync with the actual course materials.
 *
 * Design decisions:
 * - Read-only: We never write or modify any files in the course repo.
 * - Graceful fallback: If the folder doesn't exist, we fall back to hardcoded data.
 * - Cross-platform: Uses Node's `fs` and `path` modules which work on Windows, macOS, and Linux.
 *
 * Learning references:
 * - Node.js fs module: https://nodejs.org/api/fs.html
 * - Node.js path module: https://nodejs.org/api/path.html
 * - Electron + filesystem access: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
 *
 * Security note:
 * - We only read directories. No file content is executed.
 * - The path is relative to the project root, so it stays inside the user's controlled environment.
 */

import fs from 'fs';
import path from 'path';

const COURSE_CONTENT_PATH = path.join(process.cwd(), 'data', 'course-content', 'aico-echo');

/**
 * Checks whether the local course content directory exists.
 */
export function hasLocalCourseContent(): boolean {
  try {
    return fs.existsSync(COURSE_CONTENT_PATH) && fs.statSync(COURSE_CONTENT_PATH).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Discovers all available weeks and days from the local course clone.
 *
 * Expected structure:
 *   aico-echo/
 *     week1/
 *       day1/
 *       day2/
 *     week2/
 *       ...
 *
 * Returns an array of objects like:
 *   [{ week: 1, days: [1,2,3,4,5] }, { week: 2, days: [1,2,...] }, ...]
 */
export function getAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  if (!hasLocalCourseContent()) {
    return [];
  }

  try {
    const entries = fs.readdirSync(COURSE_CONTENT_PATH, { withFileTypes: true });

    const weeks = entries
      .filter((entry) => entry.isDirectory() && /^week\d+$/i.test(entry.name))
      .map((entry) => {
        const weekNum = parseInt(entry.name.replace(/^week/i, ''), 10);
        const weekPath = path.join(COURSE_CONTENT_PATH, entry.name);

        let days: number[] = [];
        try {
          const dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
          days = dayEntries
            .filter((d) => d.isDirectory() && /^day\d+$/i.test(d.name))
            .map((d) => parseInt(d.name.replace(/^day/i, ''), 10))
            .sort((a, b) => a - b);
        } catch {
          // Ignore weeks that can't be read
        }

        return { week: weekNum, days };
      })
      .filter((w) => w.days.length > 0)
      .sort((a, b) => a.week - b.week);

    return weeks;
  } catch (error) {
    console.error('Failed to scan course content directory:', error);
    return [];
  }
}

/**
 * Returns a list of week numbers that exist locally.
 */
export function getAvailableWeeks(): number[] {
  return getAvailableWeeksAndDays().map((w) => w.week);
}

/**
 * Returns the list of days available for a specific week.
 */
export function getAvailableDaysForWeek(week: number): number[] {
  const weeks = getAvailableWeeksAndDays();
  const found = weeks.find((w) => w.week === week);
  return found ? found.days : [];
}
