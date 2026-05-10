/**
 * Extract a 0–100 percentage from a git stderr progress line.
 * Git uses lines like: "Receiving objects:  45% (123/456)" and updates with \r.
 */
export function parseGitFetchProgressPercent(line: string): number | null {
  const matches = [...line.matchAll(/(\d{1,3})%/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const n = parseInt(last[1] ?? "", 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}
