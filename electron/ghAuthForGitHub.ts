/**
 * GitHub CLI integration for HTTPS git credentials after a failed clone/pull.
 * https://cli.github.com/manual/gh_auth_login
 */

import { spawn, spawnSync } from "node:child_process";

export function isGhAvailable(): boolean {
  const r = spawnSync("gh", ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  return r.status === 0;
}

function runGhCapture(
  args: string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (c: Buffer) => {
      stdout += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

/**
 * Opens the system browser for GitHub OAuth (non-interactive TTY).
 */
export async function runGhAuthLoginWeb(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { code, stderr } = await runGhCapture([
      "auth",
      "login",
      "-h",
      "github.com",
      "-p",
      "https",
      "-w",
    ]);
    if (code === 0) return { ok: true };
    const detail = stderr.trim() || `exit ${code}`;
    return { ok: false, error: detail };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function runGhAuthSetupGit(): Promise<void> {
  const { code, stderr } = await runGhCapture(["auth", "setup-git"]);
  if (code !== 0) {
    throw new Error(stderr.trim() || `gh auth setup-git failed (${code})`);
  }
}

export type GhRepoCheck = "ok" | "not_found" | "error";

/**
 * After `gh auth login`, test API visibility of the repo (404 ⇒ no access / wrong account).
 */
export async function ghApiRepoCheck(
  owner: string,
  repo: string,
): Promise<GhRepoCheck> {
  const { code, stderr, stdout } = await runGhCapture([
    "api",
    `repos/${owner}/${repo}`,
    "-q",
    ".id",
  ]);
  if (code === 0) return "ok";
  const blob = `${stderr}\n${stdout}`;
  if (/404|not found/i.test(blob)) return "not_found";
  return "error";
}
