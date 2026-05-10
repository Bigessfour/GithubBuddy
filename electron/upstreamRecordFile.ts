/**
 * After a successful clone/pull, write a read-only note in the course clone root
 * so students can see which GitHub URL GithubBuddy used.
 *
 * Overwrites are automated: a previous run chmods this file to 0o444, which blocks
 * plain open-for-write. We use rename-from-temp (POSIX: replaces destination if the
 * directory is writable) and fall back to chmod/unlink + write.
 *
 * Older builds wrote `PLATOON_COMPANION_UPSTREAM.txt`; we remove that file on success
 * so the course clone root only shows the GithubBuddy marker name.
 */

import type fs from "fs";
import type path from "path";

export const UPSTREAM_RECORD_FILENAME = "GITHUBBUDDY_UPSTREAM.txt";

const LEGACY_UPSTREAM_RECORD_FILENAMES = [
  "PLATOON_COMPANION_UPSTREAM.txt",
] as const;

function buildBody(url: string): string {
  const iso = new Date().toISOString();
  return (
    [
      "GithubBuddy — upstream source record",
      "=======================================",
      "",
      "This file was written when you ran “Fetch Upstream Repo Data” in GithubBuddy.",
      "Git does not use it. It only records which repository URL was used.",
      "Do not put passwords or personal access tokens in this file.",
      "",
      `Recorded URL: ${url}`,
      `Recorded at (UTC): ${iso}`,
      "",
      "To exclude from commits, add this filename to .gitignore or discard the file.",
      "",
    ].join("\n") + "\n"
  );
}

/** chmod 644 / unlink then write (handles leftover 0o444 file). */
function writeViaChmodOverwrite(
  fsMod: typeof fs,
  filePath: string,
  body: string,
): void {
  if (fsMod.existsSync(filePath)) {
    try {
      fsMod.chmodSync(filePath, 0o644);
    } catch {
      try {
        fsMod.unlinkSync(filePath);
      } catch {
        /* writeFileSync below may throw with a clear error */
      }
    }
  }
  fsMod.writeFileSync(filePath, body, { encoding: "utf8" });
}

export function writeReadOnlyUpstreamRecord(
  fsMod: typeof fs,
  pathMod: typeof path,
  courseCloneRoot: string,
  url: string,
): void {
  const filePath = pathMod.join(courseCloneRoot, UPSTREAM_RECORD_FILENAME);
  const body = buildBody(url);
  const dir = pathMod.dirname(filePath);

  if (!fsMod.existsSync(dir)) {
    fsMod.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }

  const tmpPath = pathMod.join(
    dir,
    `.${UPSTREAM_RECORD_FILENAME}.${process.pid}.tmp`,
  );

  let done = false;
  try {
    fsMod.writeFileSync(tmpPath, body, { encoding: "utf8" });
    fsMod.renameSync(tmpPath, filePath);
    done = true;
  } catch {
    if (fsMod.existsSync(tmpPath)) {
      try {
        fsMod.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    }
  }

  if (!done) {
    writeViaChmodOverwrite(fsMod, filePath, body);
  }

  try {
    fsMod.chmodSync(filePath, 0o444);
  } catch {
    /* chmod is best-effort (e.g. some Windows setups). */
  }

  for (const legacy of LEGACY_UPSTREAM_RECORD_FILENAMES) {
    if (legacy === UPSTREAM_RECORD_FILENAME) continue;
    const legacyPath = pathMod.join(courseCloneRoot, legacy);
    if (!fsMod.existsSync(legacyPath)) continue;
    try {
      fsMod.chmodSync(legacyPath, 0o644);
    } catch {
      /* try unlink anyway */
    }
    try {
      fsMod.unlinkSync(legacyPath);
    } catch {
      /* ignore — student may lack permission */
    }
  }
}
