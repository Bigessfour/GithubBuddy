/**
 * Maps common git/gh stderr lines to actionable steps (GitHub docs–aligned).
 * Used by CommandOutput and batch "Run all" so students see what to fix, not only raw stderr.
 */

import { GITHUB_DOC_URLS } from "../content/githubWorkflowHints";

export type CommandErrorHelp = {
  title: string;
  steps: string[];
  links: ReadonlyArray<{ label: string; href: string }>;
};

function norm(s: string): string {
  return s.toLowerCase();
}

/**
 * Returns structured guidance when we recognize the failure; otherwise null (UI shows stderr only).
 */
export function getCommandErrorHelp(
  rawError: string | undefined,
  exitCode?: number | null,
): CommandErrorHelp | null {
  if (!rawError?.trim()) return null;
  const e = norm(rawError);

  if (e.includes("not a git repository")) {
    return {
      title: "This folder is not a Git repository (no `.git` directory).",
      steps: [
        "In the app header, choose Workspace → pick the root folder of your fork clone (the folder that contains a hidden `.git` directory).",
        "Do not select a parent folder like “Code Platoon” unless that folder itself is the clone root.",
        "In Terminal you can run `ls -la` and confirm you see `.git` before retrying.",
      ],
      links: [
        { label: "Fork a repo", href: GITHUB_DOC_URLS.forkRepo },
        { label: "Clone a repository", href: GITHUB_DOC_URLS.cloneRepo },
      ],
    };
  }

  if (
    e.includes("permission denied (publickey)") ||
    e.includes("publickey denied")
  ) {
    return {
      title: "SSH authentication to GitHub failed.",
      steps: [
        "Confirm an SSH key is loaded: `ssh -T git@github.com` should greet your username.",
        "Add the public key to GitHub → Settings → SSH and GPG keys.",
        "Or switch the remote to HTTPS and use `gh auth login` / a credential helper instead of embedding tokens in URLs.",
      ],
      links: [{ label: "Connect with SSH", href: GITHUB_DOC_URLS.sshKeys }],
    };
  }

  if (
    e.includes("authentication failed") ||
    e.includes("could not read from remote repository")
  ) {
    return {
      title: "Git could not authenticate to the remote.",
      steps: [
        "For HTTPS: run `gh auth login` in Terminal, then `gh auth setup-git`, and retry.",
        "For private repos, use a fine-grained PAT with least privilege (Contents: read-only) via the credential manager — never paste tokens into the app’s URL field.",
        "Confirm `git remote -v` points at your fork or the repo you can access.",
      ],
      links: [
        { label: "Personal access tokens", href: GITHUB_DOC_URLS.personalAccessToken },
        { label: "GitHub CLI manual", href: GITHUB_DOC_URLS.ghCli },
      ],
    };
  }

  if (
    e.includes("repository not found") ||
    e.includes("not found: repository") ||
    (e.includes("remote:") && e.includes("not found"))
  ) {
    return {
      title: "GitHub reported that the repository is missing or not visible to you.",
      steps: [
        "Check the URL: typo, wrong org, or you’re signed into a GitHub account without access.",
        "For the course upstream: ask your instructor for the correct HTTPS/SSH URL.",
        "If you recently got access, sign out/in with `gh auth login` or update stored credentials.",
      ],
      links: [
        { label: "Managing remotes", href: GITHUB_DOC_URLS.managingRemotes },
        { label: "Cloning a repository", href: GITHUB_DOC_URLS.cloneRepo },
      ],
    };
  }

  if (e.includes("command blocked by allowlist")) {
    return {
      title: "This command is not in the app’s allowed list.",
      steps: [
        "Run the command manually in your own terminal in the workspace folder.",
        "Allowed prefixes in the desktop app include git, gh, mkdir, cp, and echo — ask your instructor if a new tool should be added for your cohort.",
      ],
      links: [{ label: "Managing remotes", href: GITHUB_DOC_URLS.managingRemotes }],
    };
  }

  if (e.includes("timed out") || e.includes("command timed out")) {
    return {
      title: "The command hit the app’s time limit.",
      steps: [
        "Run the same command in Terminal so it can run as long as needed.",
        "Large fetches: try `git fetch` alone first, then merge or checkout.",
      ],
      links: [{ label: "Managing remotes", href: GITHUB_DOC_URLS.managingRemotes }],
    };
  }

  if (e.includes("merge conflict") || e.includes("fix conflicts")) {
    return {
      title: "Git stopped because of merge conflicts.",
      steps: [
        "Open the files Git lists, resolve conflict markers (`<<<<<<<`), then `git add` the files.",
        "Complete the merge with `git commit` (or abort with `git merge --abort` if you need to start over).",
      ],
      links: [{ label: "Syncing a fork", href: GITHUB_DOC_URLS.syncFork }],
    };
  }

  if (exitCode === 128 && e.includes("fatal:")) {
    return {
      title: "Git exited with a fatal error (exit 128).",
      steps: [
        "Read the red error text above — it usually names the problem (auth, branch, or path).",
        "Run the same command in Terminal in your workspace for full output.",
        "Confirm remotes with `git remote -v` and that you’re on the branch you expect (`git status`).",
      ],
      links: [
        { label: "Managing remotes", href: GITHUB_DOC_URLS.managingRemotes },
        { label: "GitHub CLI", href: GITHUB_DOC_URLS.ghCli },
      ],
    };
  }

  return null;
}

/** Plain-text block for batch logs (no HTML). */
export function formatCommandErrorHelpForLog(
  rawError: string | undefined,
  exitCode?: number | null,
): string {
  const help = getCommandErrorHelp(rawError, exitCode);
  if (!help) return "";
  const lines = [
    "",
    "—— What to try (aligned with GitHub guidance) ——",
    help.title,
    ...help.steps.map((s, i) => `${i + 1}. ${s}`),
    ...help.links.map((l) => `Docs: ${l.label} — ${l.href}`),
    "",
  ];
  return lines.join("\n");
}
