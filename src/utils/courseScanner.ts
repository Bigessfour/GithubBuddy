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
 * - In **browser mode** (`npm run dev`): No Node APIs — empty scan → hardcoded weeks/days.
 * - In **desktop mode** (Electron): The preload script exposes `getCourseContentScan()` which
 *   runs `fs` synchronously in the preload context. The renderer must never call `require('fs')`
 *   or import `node:fs` — Vite bundles the renderer as browser ESM where that throws
 *   `ReferenceError: require is not defined`.
 *
 * References:
 * - Vite: https://vitejs.dev/guide/ssr.html#built-in-node-modules
 * - Electron context isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

/** True when the preload bridge exposes synchronous course scan (desktop app only). */
const usePreloadCourseScan =
  typeof window !== 'undefined' &&
  typeof (window as Window & { electronAPI?: { getCourseContentScan?: () => unknown } }).electronAPI
    ?.getCourseContentScan === 'function';

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
   ELECTRON (preload bridge — no Node in renderer bundle)
   ============================================================ */

function getScanFromPreload(): { hasLocal: boolean; weeks: Array<{ week: number; days: number[] }> } {
  try {
    const api = (window as Window & { electronAPI?: { getCourseContentScan?: () => { hasLocal: boolean; weeks: Array<{ week: number; days: number[] }> } } }).electronAPI;
    if (!api?.getCourseContentScan) {
      return { hasLocal: false, weeks: [] };
    }
    return api.getCourseContentScan();
  } catch {
    return { hasLocal: false, weeks: [] };
  }
}

function electronHasLocalCourseContent(): boolean {
  return getScanFromPreload().hasLocal;
}

function electronGetAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  return getScanFromPreload().weeks;
}

/* ============================================================
   PUBLIC API (Environment-aware)
   ============================================================ */

export function hasLocalCourseContent(): boolean {
  return usePreloadCourseScan ? electronHasLocalCourseContent() : browserHasLocalCourseContent();
}

export function getAvailableWeeksAndDays(): Array<{ week: number; days: number[] }> {
  return usePreloadCourseScan ? electronGetAvailableWeeksAndDays() : browserGetAvailableWeeksAndDays();
}

export function getAvailableWeeks(): number[] {
  return getAvailableWeeksAndDays().map(w => w.week);
}

export function getAvailableDaysForWeek(week: number): number[] {
  const weeks = getAvailableWeeksAndDays();
  const found = weeks.find(w => w.week === week);
  return found ? found.days : [];
}
