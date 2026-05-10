/**
 * Resolves the app repository root (contains `data/`, `package.json`, `index.html`).
 *
 * Never use `process.cwd()` for this in Electron: macOS and other launchers often set cwd to `/`,
 * `$HOME`, or the install folder, which breaks `git pull` / course content paths with
 * "fatal: not a git repository" or empty scans.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export function getAppProjectRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const segments = here.split(path.sep);
  const distIdx = segments.lastIndexOf("dist-electron");
  if (distIdx >= 0) {
    return path.resolve(segments.slice(0, distIdx).join(path.sep) || path.sep);
  }
  if (segments[segments.length - 1] === "electron") {
    return path.resolve(here, "..");
  }
  return path.resolve(here, "..", "..");
}
