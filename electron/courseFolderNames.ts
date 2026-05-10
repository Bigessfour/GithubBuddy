/**
 * Parse week/day directory names for Code Platoon-style course repos.
 * Supports common variants beyond strict `week1` / `day1`.
 */

const WEEK_PATTERNS: RegExp[] = [
  /^week(\d+)$/i,
  /^week[_-](\d+)$/i,
  /^week\s+(\d+)$/i,
  /^w(\d+)$/i,
];

const DAY_PATTERNS: RegExp[] = [
  /^day(\d+)$/i,
  /^day[_-](\d+)$/i,
  /^day\s+(\d+)$/i,
  /^d(\d+)$/i,
];

function firstCapture(name: string, patterns: RegExp[]): number | null {
  const trimmed = name.trim();
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

/** Week folder segment, e.g. `week1`, `week-2`, `Week 3`, `w4`. */
export function parseWeekFolderName(name: string): number | null {
  return firstCapture(name, WEEK_PATTERNS);
}

/** Day folder segment, e.g. `day1`, `day-2`, `Day 3`, `d4`. */
export function parseDayFolderName(name: string): number | null {
  return firstCapture(name, DAY_PATTERNS);
}
