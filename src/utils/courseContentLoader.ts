/**
 * Course Content Loader – v0.6 Full Day Focus from Upstream Repo
 *
 * This module loads the FULL content of the lesson, lab, and challenge files
 * for a selected Week/Day from the student's local clone of the upstream repo.
 *
 * Design follows official documentation:
 * - Vite: Conditional logic for browser vs Electron (https://vitejs.dev/guide/ssr.html#conditional-logic)
 * - Electron: Filesystem access only via preload or main process (https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts)
 *
 * In browser mode (npm run dev): always returns null (graceful fallback).
 * In Electron desktop mode: reads the day folder and returns file contents.
 *
 * The loaded content replaces the hardcoded guidance when available.
 */

export interface DayFile {
  name: string;
  content: string;
}

export interface DayFocusContent {
  week: number;
  day: number;
  files: DayFile[];
}

/**
 * Loads the full content of all relevant files in the selected day's folder.
 * Returns null in browser mode or if the folder does not exist.
 */
export function loadDayFocus(week: number, day: number): DayFocusContent | null {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
  if (!api?.getDayFocusContent) {
    return null;
  }
  try {
    return api.getDayFocusContent(week, day);
  } catch {
    return null;
  }
}
