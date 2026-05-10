/**
 * Structured errors from desktop `fetch-upstream-repo` IPC (GitHub HTTPS auth flow).
 */
export type FetchUpstreamErrorCode =
  | "GH_CLI_MISSING"
  | "GH_AUTH_FAILED"
  | "NO_REPO_ACCESS"
  | "FETCH_FAILED";
