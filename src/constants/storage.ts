/** localStorage keys for paths (fork workspace vs course clone). */
export const STORAGE_WORKSPACE = "githubbuddy-workspace";
export const STORAGE_UPSTREAM = "githubbuddy-upstream-path";

/** Set when the user dismisses the first-run process intro; bump suffix for a new intro copy. */
export const STORAGE_INTRO_DISMISSED_V1 = "githubbuddy-intro-dismissed-v1";

export function isIntroDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_INTRO_DISMISSED_V1) === "1";
  } catch {
    return false;
  }
}

export function setIntroDismissed(): void {
  try {
    localStorage.setItem(STORAGE_INTRO_DISMISSED_V1, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
