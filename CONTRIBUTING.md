# Contributing

Thanks for helping improve **Platoon Companion** (npm package `githubbuddy`).

## License

This project is under the [MIT License](LICENSE). By contributing, you agree your contributions are licensed under the same terms.

## How to propose changes

1. **Fork** the repository and clone your fork.
2. Create a **short-lived branch** (for example `feat/short-description` or `fix/issue-summary`).
3. Make focused commits using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, …).
4. **Open a Pull Request** into the upstream default branch (`main`) with a clear description and any test/lint notes.
5. Wait for **CI** (lint, tests, build, Playwright browser tests where configured) to pass.

Course staff: upstream may still be aligning day-to-day practice with this workflow; students should still follow the steps above on **their forks**.

## Before you open a PR

```bash
npm install
# If npm reports a peer dependency conflict (Vite 8 vs electron-vite), use:
# npm install --legacy-peer-deps
# Node 22.12+ required (see package.json engines). Do not use --ignore-scripts;
# if Electron fails to start, run: npm run electron:install
npm run lint
npm test -- --run
```

CI uses `npm ci --legacy-peer-deps` for the same reason—see [INSTALL.md](INSTALL.md).

If you change UI or Electron behavior that e2e covers, also run:

```bash
npm run test:e2e:ci
```

## Releases and version tags

The shipped version is the `version` field in [`package.json`](package.json). Git tags (for example `v0.6.0`) should match that version so GitHub **Releases** stay in sync.

On the commit you intend to release (usually on `main`, after merge):

```bash
git tag -a v0.6.0 -m "v0.6.0"
git push origin v0.6.0
```

Then on GitHub: **Releases → Draft a new release**, choose tag `v0.6.0`, add release notes, and publish.

## Branch protection (maintainers)

Until **branch protection** is enabled on `main`, merges are not mechanically enforced to go through PRs. Turn it on in GitHub (**Settings → Branches**) so required checks (including Playwright) must pass—see **Enabling Branch Protection** in [README.md](README.md#enabling-branch-protection-required-for-professional-workflow).

## `.cursor/` in this repository

The [`.cursor/rules/`](.cursor/rules/) folder holds optional **Cursor IDE** guidance for AI-assisted editing. It does not affect `npm run dev`, tests, or builds.

- **Cloning with Git:** the folder is part of the repo; you can leave it alone or browse it if you use Cursor.
- **If you do not use Cursor** and prefer a quieter tree locally, you may delete `.cursor` after cloning; `git pull` may restore it on updates—that is normal for tracked files.
- **Tarballs from `git archive`** omit `.cursor` (see [`.gitattributes`](.gitattributes)). The GitHub **Code → Download ZIP** button still includes the whole tree; for a lean zip, generate an archive locally with `git archive` or strip `.cursor` after download.
