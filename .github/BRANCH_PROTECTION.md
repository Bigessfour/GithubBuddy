# Branch protection on `main` (maintainers)

This cannot be committed via git — enable it in the GitHub UI so the repo matches the workflow the app teaches (PRs + green CI).

**Prefer rulesets?** See [.github/RULESET_MAIN.md](RULESET_MAIN.md) for a common-sense **branch ruleset** on `main` (required checks, PRs, no force-push), aligned with [GitHub’s rulesets documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

## Classic branch protection rule

1. Repository **Settings** → **Branches** → **Add branch protection rule**.
2. Branch name pattern: `main`.
3. Enable **Require a pull request before merging** (optional: required approvals = 1).
4. Under **Require status checks to pass before merging**, add:
   - `Lint, tests, coverage, web + electron build`
   - `Playwright (inventory + interactions)`
5. Optionally **Include administrators** and **Require conversation resolution**.

See also [README.md](../README.md#enabling-branch-protection-required-for-professional-workflow) and [docs/CLASS_READY_VERIFICATION.md](../docs/CLASS_READY_VERIFICATION.md) §4.
