/** Read a trimmed path from localStorage; null if missing, empty, or storage throws. */
export function readStoredPath(key: string): string | null {
  try {
    const v = localStorage.getItem(key)?.trim();
    return v || null;
  } catch {
    return null;
  }
}
