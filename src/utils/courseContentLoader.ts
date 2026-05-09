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

import type { DayGuidance } from '../types';

// Runtime detection (same pattern as courseScanner.ts)
const isElectronRuntime = typeof window !== 'undefined' && !!(window as any).electronAPI;

let fs: any;
let nodePath: any;

if (isElectronRuntime) {
  fs = require('fs');
  nodePath = require('path');
}

const COURSE_ROOT = isElectronRuntime && nodePath
  ? nodePath.join(process.cwd(), 'data', 'course-content', 'aico-echo')
  : '';

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
  if (!isElectronRuntime || !fs || !COURSE_ROOT) {
    return null; // Browser mode or no local clone
  }

  const dayPath = nodePath.join(COURSE_ROOT, `week${week}`, `day${day}`);

  if (!fs.existsSync(dayPath) || !fs.statSync(dayPath).isDirectory()) {
    return null;
  }

  try {
    const entries = fs.readdirSync(dayPath, { withFileTypes: true });

    // Prioritize common educational files first, then include other .md files
    const priorityFiles = ['README.md', 'lesson.md', 'lab.md', 'challenge.md'];
    const allMdFiles = entries
      .filter((entry: any) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry: any) => entry.name);

    // Deduplicate while preserving priority order
    const orderedFiles = [
      ...priorityFiles.filter(f => allMdFiles.includes(f)),
      ...allMdFiles.filter(f => !priorityFiles.includes(f))
    ];

    const files: DayFile[] = orderedFiles.map((filename: string) => {
      const filePath = nodePath.join(dayPath, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      return { name: filename, content };
    });

    return {
      week,
      day,
      files,
    };
  } catch (error) {
    console.error('Failed to load day focus content:', error);
    return null;
  }
}
