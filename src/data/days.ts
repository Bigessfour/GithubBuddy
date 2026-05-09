/**
 * Daily guidance data store.
 *
 * This file is the single source of truth for all lesson/lab/challenge workflows.
 * It is intentionally data-driven so instructors or students can add new days
 * by simply editing this file — no React code changes required.
 *
 * Design decisions:
 * - Using a plain Record<string, DayGuidance> for O(1) lookup by key "W{week}D{day}"
 * - Week 2 Day 4 is seeded with realistic steps based on the standard Code Platoon GitHub workflow you described
 * - Each step's "why" field explains the GitHub best practice so students learn the reasoning, not just the command
 *
 * References used while authoring:
 * - GitHub Flow: https://docs.github.com/en/get-started/quickstart/github-flow
 * - Pro Git - Branching: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging
 * - GitHub CLI pr create: https://cli.github.com/manual/gh_pr_create
 * - Conventional Commits: https://www.conventionalcommits.org/
 */

import type { DayGuidance } from '../types';

/**
 * All available day guidance, keyed by "W{week}D{day}" for fast lookup.
 * Currently only Week 2 Day 4 is populated. Future days are added here.
 */
export const days: Record<string, DayGuidance> = {
  'W2D4': {
    week: 2,
    day: 4,
    title: 'Week 2 - Day 4: Lesson, Lab & Challenge',
    summary: 'Set up your feature branch, complete today\'s work from the upstream lesson/lab/challenge, commit cleanly, and open a professional PR to your fork for instructor review.',
    steps: [
      {
        id: 's1',
        title: 'Update your local fork from upstream',
        why: 'Keeping your fork synchronized with the course upstream prevents merge conflicts later and ensures you start from the latest lesson materials. This is a core GitHub best practice for forked repositories.',
        command: 'git fetch upstream && git checkout main && git merge upstream/main',
        notes: 'Only run if you have already added the upstream remote (git remote add upstream https://github.com/CodePlatoon/aico-echo.git).',
        category: 'github'
      },
      {
        id: 's2',
        title: 'Create a descriptive feature branch',
        why: 'Never work directly on main. A well-named branch makes the purpose of your work instantly clear to reviewers and keeps the commit history clean. GitHub flow recommends short-lived feature branches.',
        command: 'git checkout -b week2/day4-challenge',
        category: 'git'
      },
      {
        id: 's3',
        title: 'Copy today\'s lesson, lab, and challenge files',
        why: 'The course provides daily materials in the upstream repo. Copying them into your branch keeps your work isolated and makes it easy to see exactly what you modified when you open the PR.',
        command: 'mkdir -p week2/day4 && cp -r ../aico-echo/week2/day4/* ./week2/day4/ || echo "Adjust path to where you cloned the upstream"',
        notes: 'Adjust the source path based on where you have the course repo cloned locally.',
        category: 'terminal'
      },
      {
        id: 's4',
        title: 'Complete the lesson, lab, and challenge',
        why: 'Follow the instructions in each file. This is where the real learning happens. Working in a branch means you can experiment safely without affecting your main branch.',
        command: '# Open the files in your editor and follow the day\'s instructions',
        notes: 'Focus on understanding, not just completing.',
        category: 'terminal'
      },
      {
        id: 's5',
        title: 'Stage and commit your changes with a conventional message',
        why: 'Conventional commit messages (type: subject) make the history readable and enable automated tooling. It also forces you to summarize what you did, which improves code quality.',
        command: 'git add . && git commit -m "feat(w2d4): complete lesson lab and challenge"',
        category: 'git'
      },
      {
        id: 's6',
        title: 'Push the branch to your fork',
        why: 'Pushing your branch makes it available on GitHub so you can open a PR. Always push to your fork first (origin), never directly to the course upstream.',
        command: 'git push -u origin week2/day4-challenge',
        category: 'github'
      },
      {
        id: 's7',
        title: 'Open a Pull Request to your fork',
        why: 'A PR is the professional way to propose changes. It allows your instructors to review your work, leave comments, and approve before merging. Always target your own fork, not the upstream.',
        command: 'gh pr create --base main --head week2/day4-challenge --title "Week 2 Day 4: Complete Lesson, Lab & Challenge" --body "Completed all exercises for Week 2 Day 4. Please review." --web',
        notes: 'The --web flag opens the PR form in your browser for any final edits.',
        category: 'pr'
      }
    ],
    bestPractices: [
      'Always create a feature branch instead of committing to main',
      'Use clear, consistent branch naming (weekX/dayY-topic)',
      'Write meaningful commit messages that explain the "why"',
      'Open PRs early and often for feedback',
      'Never push directly to the upstream course repository',
      'Link your PR back to the specific day\'s lesson in the description'
    ]
  }
};

/**
 * Lookup function used by the useDayGuidance hook.
 * Returns undefined if the requested day has not been authored yet.
 * This design allows the UI to gracefully show "not yet available" messages.
 */
export function getDayGuidance(week: number, day: number): DayGuidance | undefined {
  const key = `W${week}D${day}`;
  return days[key];
}
