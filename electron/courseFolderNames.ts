/**
 * Parse week/day directory names for Code Platoon-style course repos.
 * Supports common variants beyond strict `week1` / `day1`.
 */

/** Prefix at folder start; allows suffixes like Week14-CICD or Day04-AM. */
const WEEK_PATTERNS: RegExp[] = [
  /^week\s*[_-]?\s*(\d+)/i,
  /^w(\d+)(?:\D|$)/i,
];

const DAY_PATTERNS: RegExp[] = [
  /^day\s*[_-]?\s*(\d+)/i,
  /^d(\d+)(?:\D|$)/i,
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

/** Week folder segment, e.g. `week1`, `Week14-Topic`, `w4`. */
export function parseWeekFolderName(name: string): number | null {
  return firstCapture(name, WEEK_PATTERNS);
}

/** Day folder segment, e.g. `day1`, `Day04-AM`, `DAY4PM-topic`, `d4`. */
export function parseDayFolderName(name: string): number | null {
  return firstCapture(name, DAY_PATTERNS);
}
