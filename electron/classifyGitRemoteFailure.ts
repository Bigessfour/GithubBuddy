/**
 * Heuristic: git often cannot distinguish "private, no creds" from "not found".
 * We treat several stderr patterns as "try GitHub CLI HTTPS auth + retry".
 */

export type GitRemoteFailureKind = "auth_like" | "other";

const AUTH_LIKE_PATTERNS: RegExp[] = [
  /authentication failed/i,
  /could not read from remote/i,
  /access denied/i,
  /permission denied/i,
  /invalid username or password/i,
  /incorrect username or password/i,
  /repository not found/i,
  /terminal prompts disabled/i,
  /no access/i,
  /403/i,
  /401/i,
  /unable to access/i,
  /failed to connect/i,
  /gnutls_handshake/i,
  /ssl.*error/i,
];

export function classifyGitRemoteFailure(stderr: string): GitRemoteFailureKind {
  const s = stderr.trim();
  if (!s) return "other";
  for (const re of AUTH_LIKE_PATTERNS) {
    if (re.test(s)) return "auth_like";
  }
  return "other";
}

export function isGithubHttpsUrl(url: string): boolean {
  return /^https:\/\/github\.com\//i.test(url.trim());
}

/** owner/repo from https://github.com/org/name(.git) */
export function parseGithubHttpsOwnerRepo(
  url: string,
): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\/+$/, "");
  const m = trimmed.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
  );
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}
