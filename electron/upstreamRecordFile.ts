/**
 * After a successful clone/pull, write a read-only note in the course clone root
 * so students can see which GitHub URL Platoon Companion used.
 */

import type fs from "fs";
import type path from "path";

export const UPSTREAM_RECORD_FILENAME = "PLATOON_COMPANION_UPSTREAM.txt";

export function writeReadOnlyUpstreamRecord(
  fsMod: typeof fs,
  pathMod: typeof path,
  courseCloneRoot: string,
  url: string,
): void {
  const filePath = pathMod.join(courseCloneRoot, UPSTREAM_RECORD_FILENAME);
  const iso = new Date().toISOString();
  const body =
    [
      "Platoon Companion — upstream source record",
      "=======================================",
      "",
      "This file was written when you ran “Fetch Upstream Repo Data” in Platoon Companion.",
      "Git does not use it. It only records which repository URL was used.",
      "Do not put passwords or personal access tokens in this file.",
      "",
      `Recorded URL: ${url}`,
      `Recorded at (UTC): ${iso}`,
      "",
      "To exclude from commits, add this filename to .gitignore or discard the file.",
      "",
    ].join("\n") + "\n";

  fsMod.writeFileSync(filePath, body, { encoding: "utf8" });
  try {
    fsMod.chmodSync(filePath, 0o444);
  } catch {
    /* chmod is best-effort (e.g. some Windows setups). */
  }
}
