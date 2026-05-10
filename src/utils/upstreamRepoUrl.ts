/**
 * Validates upstream repo URLs for "Fetch upstream" — GitHub-only, safe for embedding in git clone.
 * Prevents command injection and mistaken non-GitHub remotes.
 */

export const DEFAULT_UPSTREAM_REPO =
  "https://github.com/CodePlatoon/aico-echo.git";

function hasDangerousRepoUrlChars(s: string): boolean {
  if (s.includes("\0") || s.includes("`")) return true;
  return /[;&|$\n\r\\]|(\.\.)/.test(s);
}

/** GitHub HTTPS: https://github.com/org/repo or .../repo.git */
const HTTPS_GITHUB =
  /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?\/?$/;

/** git@github.com:org/repo(.git) */
const SSH_SHORT =
  /^git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/;

/** ssh://git@github.com/org/repo(.git) */
const SSH_URL =
  /^ssh:\/\/git@github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?\/?$/;

export type ValidatedUpstream =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Returns the default Code Platoon URL when input is blank; otherwise validates GitHub remote shape.
 */
export function resolveValidatedUpstreamUrl(
  repoUrl?: string | null,
): ValidatedUpstream {
  const trimmed = repoUrl?.trim() ?? "";
  if (trimmed === "") {
    return { ok: true, url: DEFAULT_UPSTREAM_REPO };
  }

  if (hasDangerousRepoUrlChars(trimmed)) {
    return {
      ok: false,
      error:
        "URL contains characters that are not allowed. Use a plain GitHub HTTPS or git@ URL with no spaces or shell symbols.",
    };
  }

  if (
    HTTPS_GITHUB.test(trimmed) ||
    SSH_SHORT.test(trimmed) ||
    SSH_URL.test(trimmed)
  ) {
    return { ok: true, url: trimmed };
  }

  return {
    ok: false,
    error:
      "Only github.com repository URLs are allowed (HTTPS or git@), or leave blank for the default course repo. Example: https://github.com/CodePlatoon/aico-echo.git",
  };
}
