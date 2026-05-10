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

---

## If GitHub shows **“Rule not valid”** (or won’t save)

These are the usual causes and fixes:

### 1. Required status checks: nothing selected or wrong name

- Turning on **Require status checks to pass before merging** without adding **at least one** check from the search list is invalid.
- You **cannot type** a random name; pick each check from the **search dropdown** only.
- GitHub often labels Actions checks as **`Test / …`** (workflow `name` from [test.yml](workflows/test.yml) is `Test`). Search for **`Test`** or **`Lint`** and select:
  - **`Test / Lint, tests, coverage, web + electron build`**
  - **`Test / Playwright (inventory + interactions)`**
- If the dropdown is **empty**, GitHub hasn’t recorded those checks yet. Trigger a run first: merge or push to `main`, or open/update a PR so [Test](workflows/test.yml) finishes once, then try again. See GitHub’s [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks).

### 2. Enable the rule in two steps (classic protection)

1. Create the rule with **only** branch name `main`, **Block force pushes**, and **Require a pull request before merging** — **leave “Require status checks” off** → **Save**.
2. **Edit** the rule → turn on **Require status checks** → add the two checks from the dropdown → **Save**.

That avoids a bad first save when the UI is picky about check configuration.

### 3. Rulesets

If you use **Settings → Rules → Rulesets** instead, see GitHub’s [Troubleshooting rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules). Invalid combinations or missing targets can block saving; use **Evaluate** enforcement first to test.

### 4. Organization / plan limits

Some rules (e.g. certain ruleset features) need specific GitHub plans. If you’re on a free org repo, stick to **classic branch protection** above or a simple ruleset without enterprise-only rules.
