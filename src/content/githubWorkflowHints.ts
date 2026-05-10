/**
 * Short copy for tooltips and toasts. Tooltips follow GitHub Primer guidance:
 * supplementary context on interactive controls, concise, non-essential detail
 * (see https://primer.style/product/components/tooltip/accessibility).
 *
 * Official GitHub workflow references (students can open these for depth):
 */
export const GITHUB_DOC_URLS = {
  forkRepo: "https://docs.github.com/en/get-started/quickstart/fork-a-repo",
  syncFork:
    "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork",
  createPrFromFork:
    "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork",
  cloneRepo:
    "https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository",
  managingRemotes:
    "https://docs.github.com/en/get-started/git-basics/managing-remote-repositories",
  personalAccessToken:
    "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token",
  sshKeys:
    "https://docs.github.com/en/authentication/connecting-to-github-with-ssh",
  ghCli: "https://cli.github.com/manual/",
} as const;

/** Tooltip strings: extra context only; primary actions stay visible in the UI. */
export const WORKFLOW_TOOLTIPS = {
  workspaceChoose:
    "Pick your fork or project folder on disk. Commands run here (your cwd). GitHub recommends working in a local clone of your fork, not the upstream repo directly.",
  workspaceClear:
    "Clear the saved path. Run buttons stay off until you choose a folder again.",
  workspaceNewFolder:
    "Pick a parent folder, name your new workspace folder, then we create it and set it as your workspace. (You can also use New Folder inside the desktop folder picker.)",

  upstreamPath:
    "Local folder path to your course repo clone (e.g. aico-echo), not a GitHub URL. Fills {{UPSTREAM}} in copied commands only; your workspace folder is still where Run/cwd executes.",
  upstreamSave:
    "Store this path in the app (and browser storage) so {{UPSTREAM}} resolves in the checklist.",
  upstreamBrowse:
    "Open a folder picker to select the root of your local course repo clone.",
  upstreamClear:
    "Remove the saved upstream path. Placeholders stay visible until you set a new path.",

  weekSelect:
    "Choose the lesson week. On GitHub you typically work on a branch per feature; weeks map to how this course sequences topics.",
  daySelect:
    "Choose the lesson day. Match this to the cohort schedule before running steps.",

  fetchUpstream:
    "Uses the URL in the field above (or the Code Platoon default if you leave it blank). Runs git clone or git pull into data/course-content/aico-echo. For HTTPS GitHub URLs, the app may open a browser to sign in via the GitHub CLI (gh) if git reports missing access—never put passwords or tokens in the URL box.",

  fetchUpstreamRepoUrl:
    "Paste your cohort’s course repo on GitHub: HTTPS (https://github.com/Org/repo.git) or SSH (git@github.com:Org/repo.git). Leave empty to use the default upstream. Do not paste tokens here. After success, a small read-only note file is saved inside the clone folder with this URL.",

  fetchUpstreamUrlHelp:
    "This is the GitHub address to clone or update—not your fork’s local folder path. Blank = default course repo. Fetch either clones into data/course-content/aico-echo or runs git pull there if it already exists.",

  copyCommand:
    "Copies the resolved command. Paste into your terminal in the workspace folder, or use Run in the desktop app.",
  runCommand:
    "Runs the command in your selected workspace (preview in the confirm dialog first). Matches the habit of running git in your repo root.",
  runAll:
    "Runs runnable shell steps in order and stops on the first failure—similar to a careful local CI run before you open a PR.",

  progress:
    "Track checklist completion for this day. On GitHub, small commits and green local checks make reviews easier.",

  bestPracticesAside:
    "Reminders align with GitHub flow: branch from main, push to your fork, open PRs to upstream, and keep commits focused.",
} as const;

/** Main process: `upstream-status` copy during automatic `gh auth login`. */
export const UPSTREAM_STATUS_GH = {
  openingBrowser: "Opening GitHub sign-in in your browser…",
  configuringGit: "Configuring git to use GitHub credentials…",
  retrying: "Retrying clone or pull…",
} as const;

export const WORKFLOW_TOASTS = {
  copiedCommand:
    "Command copied — paste it in your terminal inside the workspace folder.",
  copyFailed:
    "Could not copy. Select the command text manually or check clipboard permissions.",
  workspaceSet:
    "Workspace folder saved. Commands will use it as the working directory.",
  workspaceFolderCreated:
    "New folder created and set as your workspace.",
  workspaceFolderCreateFailed: "Could not create workspace folder.",
  workspaceNewFolderWeb:
    "In the browser preview, create a folder in Finder or File Explorer, then use Choose workspace folder and type or paste its full path.",
  upstreamSaved:
    "Upstream path saved. {{UPSTREAM}} in steps will use this folder.",
  upstreamCleared: "Upstream path cleared.",
  fetchUpstreamSuccess:
    "Course content updated. Week/day lists refresh from the local clone.",
  fetchUpstreamGhMissing:
    "GitHub CLI (gh) is not installed. Install it from https://cli.github.com/ then try Fetch upstream again.",
  fetchUpstreamGhAuthFailed:
    "GitHub sign-in did not finish. Try Fetch upstream again, or use a GitHub account that can access the course repository.",
  fetchUpstreamNoRepoAccess:
    "Your GitHub account cannot access this repository. Ask your Code Platoon instructor for the correct repo URL or access.",
  runAllFinished:
    "Run all finished. Review the log above for any stopped steps.",
  /** Shown when generic fetch fails — students should fix auth before retrying. */
  fetchUpstreamFetchFailed:
    "Git could not update the course repo. If you use HTTPS: sign in with the GitHub CLI (gh) when prompted, or use SSH and an SSH key added to GitHub. If the repo is private, confirm your account has access.",
} as const;
