/**
 * Daily guidance data store.
 *
 * Aligned with the Code Platoon Instructor GIT Challenge Submission Workflow
 * (see docs/git-challenge-submission-workflow.docx and docs/instructor-gitignore-template.txt).
 * Commands use placeholders {{WEEK}}, {{DAY}}, {{BRANCH}}, and optionally {{UPSTREAM}}
 * via buildStepCommand (see src/utils/commandInterpolation.ts).
 */

import type { DayGuidance, Step } from "../types";

const STANDARD_BEST_PRACTICES = [
  "Use the exact branch name `w2d4-challenges` pattern: `w{week}d{day}-challenges` for every challenge that day—reuse it even if you finish late; you may have several active branches if you are behind",
  "Create a subdirectory per challenge under the day folder (e.g. `week2/day4/challenge-1`, `challenge-2`, …)",
  'Commit using the exact message format: Complete week X day Y challenge Z (quote the whole message in git commit -m)',
  "PR title follows the instructor pattern, e.g. W2D4 - Challenge 1 - Your Full Name (see the instructor guide screenshot)",
  "Pushing new commits to the same branch updates an open PR automatically—no second PR needed",
  "Confirm `origin` is your fork and `upstream` is CodePlatoon (`git remote -v`) before you start",
  "Add the instructor `.gitignore` template once at the repo root (copy from this app or the guide)",
  "TAs add the label `TA review complete` when review is done—watch your PR on GitHub",
  "Never push directly to the upstream CodePlatoon course repository",
] as const;

function standardSteps(): Step[] {
  return [
    {
      id: "s1",
      title: "Create .gitignore using the instructor template (one-time)",
      why: "The instructor template ignores OS cruft, IDE files, logs, secrets, build output, node_modules, Python/Java/Go/Rust artifacts, Docker/Terraform noise, and more—so you never commit junk by accident. This matches step 3 in the official workflow.",
      command:
        "cp /path/to/GithubBuddy/docs/instructor-gitignore-template.txt .gitignore",
      notes:
        "Run from your **course fork** root. Replace `/path/to/GithubBuddy` with the folder where you cloned **GithubBuddy** (this app). The same template is at `docs/instructor-gitignore-template.txt` in this repo and matches the instructor Word guide appendix.",
      category: "terminal",
    },
    {
      id: "s2",
      title: "Confirm remotes: origin = your fork, upstream = CodePlatoon",
      why: "Verifies you push to your fork and can pull course updates from the canonical upstream when needed. Matches the instructor guide (fork/clone section).",
      command: "git remote -v",
      notes:
        "If `upstream` is missing: `git remote add upstream https://github.com/CodePlatoon/aico-echo.git` (or the URL your instructor gives for the weekly repo). `origin` should be your fork.",
      category: "github",
    },
    {
      id: "s3",
      title: "Create and check out the challenge branch for this day",
      why: "This branch (`w{week}d{day}-challenges`) is the one branch for **all** challenges that day—even if you finish later. Switch back to it whenever you work on that day. You may keep up to about four active branches if you are behind; always match branch to the day you are submitting.",
      command: "git checkout -b {{BRANCH}}",
      category: "git",
    },
    {
      id: "s4",
      title: "Create a folder for each challenge under the day directory",
      why: "Keeps challenge 1, 2, 3… isolated so reviewers see exactly what belongs to each submission. Matches instructor steps 5–6.",
      command: "mkdir -p week{{WEEK}}/day{{DAY}}/challenge-1",
      notes:
        "Add `challenge-2`, `challenge-3`, … as needed. Folder names should match how the assignment names the challenges.",
      category: "terminal",
    },
    {
      id: "s5",
      title: "Move into the challenge folder and do the work",
      why: "All edits for this challenge live under that directory so your commits and PR scope stay clear.",
      command:
        "# cd week{{WEEK}}/day{{DAY}}/challenge-1   # change challenge-1 if you are on a different challenge",
      notes:
        "Remove the leading `#` and run in your terminal, or `cd` manually. (Comment prefix skips “Run all” for this navigation line.)",
      category: "terminal",
    },
    {
      id: "s6",
      title: "Stage your changes",
      why: "Prepares files for the commit that matches the instructor-required message format.",
      command: "git add .",
      category: "git",
    },
    {
      id: "s7",
      title: "Commit with the exact instructor message format",
      why: "TAs expect a precise sentence: Complete week X day Y challenge Z. Use challenge 2, 3, … in the message when you commit later work on the same branch.",
      command:
        'git commit -m "Complete week {{WEEK}} day {{DAY}} challenge 1"',
      notes:
        "For the next challenge on this branch, change the trailing number to `2`, `3`, etc., and commit again.",
      category: "git",
    },
    {
      id: "s8",
      title: "Push your branch to origin (updates an open PR automatically)",
      why: "Sends commits to your fork. If a PR for this branch is already open, another push adds commits to that PR—no new PR required.",
      command: "git push -u origin {{BRANCH}}",
      notes:
        "After the first push, plain `git push` is enough. Always push to **origin** (your fork), never to upstream.",
      category: "github",
    },
    {
      id: "s9",
      title: "Open a Pull Request with the instructor title format",
      why: "PRs are how you submit for review. TAs comment and apply the `TA review complete` label when finished. Use the naming convention from the guide’s screenshot.",
      command:
        'gh pr create --base main --head {{BRANCH}} --title "W{{WEEK}}D{{DAY}} - Challenge 1 - [Your Full Name]" --body "Completed Week {{WEEK}} Day {{DAY}} Challenge 1 per the instructor Git workflow. Work is in week{{WEEK}}/day{{DAY}}/challenge-1/." --web',
      notes:
        "Replace `[Your Full Name]` with your name. Adjust Challenge number and body path if needed. If a PR already exists for this branch, skip this step and only push (previous step). `--web` opens the form for final edits.",
      category: "pr",
    },
  ];
}

/** GIT challenge submission workflow for one class day (instructor-aligned). */
export function buildStandardGithubDayWorkflow(
  week: number,
  day: number,
): DayGuidance {
  return {
    week,
    day,
    title: `Week ${week} - Day ${day}: Git challenge submission (${`w${week}d${day}-challenges`})`,
    summary:
      "Follow the instructor workflow: add the shared .gitignore, confirm remotes, use branch wXdX-challenges for the whole day, create per-challenge folders, commit with the exact “Complete week X day Y challenge Z” message, push to your fork, open or refresh a PR with the WXD - Challenge N - Name title. TAs label TA review complete when done.",
    steps: standardSteps(),
    bestPractices: [...STANDARD_BEST_PRACTICES],
  };
}

/**
 * All available day guidance, keyed by "W{week}D{day}" for fast lookup.
 * Week 2 Days 1–5 share the same instructor-aligned structure.
 */
export const days: Record<string, DayGuidance> = {
  W2D1: buildStandardGithubDayWorkflow(2, 1),
  W2D2: buildStandardGithubDayWorkflow(2, 2),
  W2D3: buildStandardGithubDayWorkflow(2, 3),
  W2D4: buildStandardGithubDayWorkflow(2, 4),
  W2D5: buildStandardGithubDayWorkflow(2, 5),
};

export function getDayGuidance(
  week: number,
  day: number,
): DayGuidance | undefined {
  const key = `W${week}D${day}`;
  return days[key];
}
