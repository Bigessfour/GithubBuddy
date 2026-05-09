/**
 * Course Content Scanner – Safe for Both Browser and Desktop
 *
 * PURPOSE:
 * This module detects whether the user has a local copy of the private
 * Code Platoon course repository (`aico-echo`) and exposes the available
 * weeks/days so the UI can populate the selector dynamically.
 *
 * CRITICAL ARCHITECTURE RULE (from official docs):
 *
 * Vite Documentation:
 *   - "Node.js built-in modules (fs, path, etc.) cannot be imported
 *     directly in client-side (browser) code."
 *   - Source: https://vitejs.dev/guide/ssr.html#built-in-node-modules
 *
 * Electron Documentation:
 *   - "Renderer processes run in a Chromium sandbox.
 *     Node APIs must only be used in the main process or preload scripts."
 *   - Source: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 *
 * IMPLEMENTATION STRATEGY:
 * - In **browser mode** (`npm run dev`): This file must never touch Node APIs.
 *   All functions return empty results → the app falls back to hardcoded data.
 * - In **desktop mode** (Electron): We can safely use `fs`/`path` because the
 *   code only runs after going through the preload bridge (future improvement).
 *
 * For v0.4 we keep it simple: the dynamic scanner is **Electron-only**.
 * The browser version always uses the hardcoded Week 2 Day 4 guidance.
 */

import type { DayGuidance } from '../types';

// Runtime environment detection
const isElectronRuntime = typeof window !== 'undefined' && !!(window as any).electronAPI;

/* ============================================================
   BROWSER-SAFE (NO-OP) IMPLEMENTATIONS
   These are used when running `npm run dev`
   ============================================================ */

function browserHasLocalCourseContent(): boolean {
  return false;
}

function browserGetAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  return [];
}

/* ============================================================
   ELECTRON IMPLEMENTATIONS (only loaded when safe)
   ============================================================ */

let fs: any;
let nodePath: any;
let COURSE_CONTENT_PATH = '';

if (isElectronRuntime) {
  // We are inside Electron → it is safe to require Node modules
  // This block only executes in the desktop app.
  fs = require('fs');
  nodePath = require('path');
  COURSE_CONTENT_PATH = nodePath.join(process.cwd(), 'data', 'course-content', 'aico-echo');
}

function electronHasLocalCourseContent(): boolean {
  if (!fs || !COURSE_CONTENT_PATH) return false;
  try {
    return fs.existsSync(COURSE_CONTENT_PATH) && fs.statSync(COURSE_CONTENT_PATH).isDirectory();
  } catch {
    return false;
  }
}

function electronGetAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  if (!electronHasLocalCourseContent()) return [];

  try {
    const entries = fs.readdirSync(COURSE_CONTENT_PATH, { withFileTypes: true });

    const weeks = entries
      .filter((entry: any) => entry.isDirectory() && /^week\d+$/i.test(entry.name))
      .map((entry: any) => {
        const weekNum = parseInt(entry.name.replace(/^week/i, ''), 10);
        const weekPath = nodePath.join(COURSE_CONTENT_PATH, entry.name);

        let days: number[] = [];
        try {
          const dayEntries = fs.readdirSync(weekPath, { withFileTypes: true });
          days = dayEntries
            .filter((d: any) => d.isDirectory() && /^day\d+$/i.test(d.name))
            .map((d: any) => parseInt(d.name.replace(/^day/i, ''), 10))
            .sort((a: number, b: number) => a - b);
        } catch {
          // ignore unreadable week folders
        }

        return { week: weekNum, days };
      })
      .filter((w: any) => w.days.length > 0)
      .sort((a: any, b: any) => a.week - b.week);

    return weeks;
  } catch (error) {
    console.error('Failed to scan course content directory:', error);
    return [];
  }
}

/* ============================================================
   PUBLIC API (Environment-aware)
   ============================================================ */

export function hasLocalCourseContent(): boolean {
  return isElectronRuntime ? electronHasLocalCourseContent() : browserHasLocalCourseContent();
}

export function getAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  return isElectronRuntime ? electronGetAvailableWeeksAndDays() : browserGetAvailableWeeksAndDays();
}

export function getAvailableWeeks(): number[] {
  return getAvailableWeeksAndDays().map(w => w.week);
}

export function getAvailableDaysForWeek(week: number): number[] {
  const weeks = getAvailableWeeksAndDays();
  const found = weeks.find(w => w.week === week);
  return found ? found.days : [];
}
