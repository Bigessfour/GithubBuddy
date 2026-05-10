/**
 * Daily guidance data store.
 *
 * Commands use placeholders {{WEEK}}, {{DAY}}, {{BRANCH}}, {{UPSTREAM}} resolved at runtime
 * via buildStepCommand (see src/utils/commandInterpolation.ts).
 */

import type { DayGuidance, Step } from "../types";

const STANDARD_BEST_PRACTICES = [
  "Always create a feature branch instead of committing to main",
  "Use clear, consistent branch naming (weekX/dayY-topic)",
  'Write meaningful commit messages that explain the "why"',
  "Open PRs early and often for feedback",
  "Never push directly to the upstream course repository",
  "Link your PR back to the specific day's lesson in the description",
] as const;

function standardSteps(): Step[] {
  return [
    {
      id: "s1",
      title: "Update your local fork from upstream",
      why: "Keeping your fork synchronized with the course upstream prevents merge conflicts later and ensures you start from the latest lesson materials. This is a core GitHub best practice for forked repositories.",
      command:
        "git fetch upstream && git checkout main && git merge upstream/main",
      notes:
        "Only run if you have already added the upstream remote (git remote add upstream https://github.com/CodePlatoon/aico-echo.git).",
      category: "github",
    },
    {
      id: "s2",
      title: "Create a descriptive feature branch",
      why: "Never work directly on main. A well-named branch makes the purpose of your work instantly clear to reviewers and keeps the commit history clean. GitHub flow recommends short-lived feature branches.",
      command: "git checkout -b {{BRANCH}}",
      category: "git",
    },
    {
      id: "s3",
      title: "Copy today's lesson, lab, and challenge files",
      why: "The course provides daily materials in the upstream repo. Copying them into your branch keeps your work isolated and makes it easy to see exactly what you modified when you open the PR.",
      command:
        'mkdir -p week{{WEEK}}/day{{DAY}} && cp -r {{UPSTREAM}}/week{{WEEK}}/day{{DAY}}/* ./week{{WEEK}}/day{{DAY}}/ || echo "Set Course/upstream folder if copy fails"',
      notes:
        "Uses your saved upstream path for {{UPSTREAM}}. Ensure that folder contains week{{WEEK}}/day{{DAY}}.",
      category: "terminal",
    },
    {
      id: "s4",
      title: "Complete the lesson, lab, and challenge",
      why: "Follow the instructions in each file. This is where the real learning happens. Working in a branch means you can experiment safely without affecting your main branch.",
      command:
        "# Open the files in your editor and follow the day's instructions",
      notes: "Focus on understanding, not just completing.",
      category: "terminal",
    },
    {
      id: "s5",
      title: "Stage and commit your changes with a conventional message",
      why: "Conventional commit messages (type: subject) make the history readable and enable automated tooling. It also forces you to summarize what you did, which improves code quality.",
      command:
        'git add . && git commit -m "feat(w{{WEEK}}d{{DAY}}): complete lesson lab and challenge"',
      category: "git",
    },
    {
      id: "s6",
      title: "Push the branch to your fork",
      why: "Pushing your branch makes it available on GitHub so you can open a PR. Always push to your fork first (origin), never directly to the course upstream.",
      command: "git push -u origin {{BRANCH}}",
      category: "github",
    },
    {
      id: "s7",
      title: "Open a Pull Request to your fork",
      why: "A PR is the professional way to propose changes. It allows your instructors to review your work, leave comments, and approve before merging. Always target your own fork, not the upstream.",
      command:
        'gh pr create --base main --head {{BRANCH}} --title "Week {{WEEK}} Day {{DAY}}: Complete Lesson, Lab & Challenge" --body "Completed all exercises for Week {{WEEK}} Day {{DAY}}. Please review." --web',
      notes:
        "The --web flag opens the PR form in your browser for any final edits.",
      category: "pr",
    },
  ];
}

/** Standard GitHub workflow for a single class day (fork → branch → copy → commit → PR). */
export function buildStandardGithubDayWorkflow(
  week: number,
  day: number,
): DayGuidance {
  return {
    week,
    day,
    title: `Week ${week} - Day ${day}: Lesson, Lab & Challenge`,
    summary:
      "Set up your feature branch, complete today's work from the upstream lesson/lab/challenge, commit cleanly, and open a professional PR to your fork for instructor review.",
    steps: standardSteps(),
    bestPractices: [...STANDARD_BEST_PRACTICES],
  };
}

/**
 * All available day guidance, keyed by "W{week}D{day}" for fast lookup.
 * Week 2 Days 1–5 share the same structure; adjust per-day copy here if needed later.
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
