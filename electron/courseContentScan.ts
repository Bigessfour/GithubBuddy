/**
 * Synchronous filesystem scan for local course repo layout.
 * Imported only by preload — never by the Vite renderer bundle.
 *
 * Electron security model: Node APIs in preload/main, not in renderer.
 * https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

import fs from 'node:fs';
import path from 'node:path';

export type WeekDayInfo = { week: number; days: number[] };

export function scanCourseContentFromDisk(): { hasLocal: boolean; weeks: WeekDayInfo[] } {
  const coursePath = path.join(process.cwd(), 'data', 'course-content', 'aico-echo');

  let hasLocal: boolean;
  try {
    hasLocal = fs.existsSync(coursePath) && fs.statSync(coursePath).isDirectory();
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
        const weekNum = parseInt(entry.name.replace(/^week/i, ''), 10);
        const weekPath = path.join(coursePath, entry.name);

        let days: number[] = [];
        try {
          const dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
          days = dayEntries
            .filter((d) => d.isDirectory() && /^day\d+$/i.test(d.name))
            .map((d) => parseInt(d.name.replace(/^day/i, ''), 10))
            .sort((a, b) => a - b);
        } catch {
          // ignore unreadable week folders
        }

        return { week: weekNum, days };
      })
      .filter((w) => w.days.length > 0)
      .sort((a, b) => a.week - b.week);

    return { hasLocal: true, weeks };
  } catch (error) {
    console.error('[courseContentScan] Failed to scan course content directory:', error);
    return { hasLocal: true, weeks: [] };
  }
}
