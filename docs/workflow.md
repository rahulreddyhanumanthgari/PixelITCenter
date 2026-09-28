# Branch & release workflow

```
feature/<name>  ──PR──▶  develop  ──PR──▶  master
  (your work)          (playground,        (production-ready)
                        test here)
```

## Branches

| Branch | Purpose | Who merges into it |
|---|---|---|
| `master` | Production-ready code. What goes live. | **Only `develop`**, through a pull request |
| `develop` | Shared playground. Everything is tested here first. | Feature branches, through a pull request |
| `feature/<name>` | One piece of work (e.g. `feature/services-page`). Short-lived. | You |

## Day-to-day

1. Start from the latest `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/<name>
   ```
2. Commit your work on the feature branch.
3. Push it and open a **pull request into `develop`**.
4. CI runs lint, type check and build. Fix anything red.
5. Merge into `develop` and test it there (preview / staging).
6. When `develop` is tested and approved, open a **pull request from `develop` into `master`**.

## Automated checks

| Workflow | Runs on | Checks |
|---|---|---|
| `.github/workflows/ci.yml` | PRs into `develop` / `master`, pushes to `develop` | `npm run lint`, `npm run typecheck`, `npm run build` |
| `.github/workflows/only-develop-to-master.yml` | PRs into `master` | Fails unless the PR comes from `develop` |

## Branch protection (repo admin, one-time)

The checks above only show a red ❌ until GitHub is told to enforce them.
In **Settings → Branches → Add rule**:

**`master`**
- Require a pull request before merging
- Require status checks to pass: `check-source-branch`, `checks`
- Do not allow bypassing the above settings
- Block force pushes

**`develop`**
- Require a pull request before merging
- Require status checks to pass: `checks`

Status checks only appear in that list after they have run once on a PR.
