# Common-sense ruleset for `main` (maintainers)

GitHub **rulesets** are a modern way to protect branches: they work **alongside** classic branch protection rules, support clear statuses (active/disabled), and are visible to anyone with read access so contributors understand why a push or merge was blocked. See GitHub’s overview: [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

This repo’s CI job names come from [.github/workflows/test.yml](workflows/test.yml). Use them as **required status checks** so `main` only moves forward when lint, tests, coverage, web build, Electron build, and Playwright all pass.

## Create the ruleset (UI)

1. Open the repository on GitHub → **Settings**.
2. Under **Code and automation**, open **Rules** → **Rulesets**.
3. **New ruleset** → **New branch ruleset**.
4. **Ruleset name:** e.g. `Protect main — CI + PR`.
5. **Enforcement status:** **Active** (use **Evaluate** first if you want a dry run without blocking).
6. **Target branches:** **Add target** → **Include default branch** *or* **Add inclusion pattern** → `main`.

### Branch rules to enable (sensible defaults)

Turn on the subset that matches how strictly you want to run the cohort upstream:

| Rule | Why |
|------|-----|
| **Require a pull request before merging** | Matches the GitHub Flow the app teaches; optional **Required approvals** = 1 for review. |
| **Require status checks to pass** | Add both checks from CI (exact names below). |
| **Block force pushes** | Prevents history rewrite on `main`. |
| **Require linear history** | Optional; keeps `main` easy to read (no merge commits) if you always squash or rebase-merge. |
| **Require conversation resolution before merging** | Optional; useful once you have multi-reviewer PRs. |

**Required status checks** — always pick from GitHub’s **search list** (do not paste a name GitHub doesn’t offer). After [Test](workflows/test.yml) has run at least once, the UI usually shows them with a **`Test /`** prefix (workflow name + job name):

- `Test / Lint, tests, coverage, web + electron build`
- `Test / Playwright (inventory + interactions)`

Some screens show only the job name; use whatever appears for **your** repo. If the list is empty, wait for Actions to complete on `main` or on a PR, then try again. If saving fails with **“Rule not valid”**, see [BRANCH_PROTECTION.md § troubleshooting](BRANCH_PROTECTION.md#if-github-shows-rule-not-valid-or-wont-save) and GitHub’s [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks).

### Bypass (optional)

Restrict bypass to **Repository admin** only if you still need an emergency path; avoid broad bypass or the ruleset loses teeth for day-to-day teaching.

## Rulesets vs branch protection

You can use **only** a ruleset, **only** classic branch protection ([BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)), or **both**. If both apply, GitHub aggregates rules and uses the **stricter** requirement where they overlap. See [About rulesets and protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#about-rulesets-and-protected-branches).

## Also read

- [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [README.md](../README.md#enabling-branch-protection-required-for-professional-workflow)
- [docs/CLASS_READY_VERIFICATION.md](../docs/CLASS_READY_VERIFICATION.md) §4
