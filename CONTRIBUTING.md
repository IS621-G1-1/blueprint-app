# Contributing

Source of truth: [`blueprint-knowledge-base/project/branching-strategy.md`](../blueprint-knowledge-base/project/branching-strategy.md). This file summarizes the parts engineers contributing to `blueprint-app` need day-to-day.

## Branching model

```
feature/*  ──►  dev  ──►  main
```

| Branch | Purpose | Merges into |
|--------|---------|-------------|
| `main` | Demo-ready, tagged releases. Always deployable. | — |
| `dev` | Integration branch. Latest working code from all features. | `main` (via PR) |
| `feature/*` | Individual work items. Short-lived. | `dev` (via PR) |

## Naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/keycloak-login` |
| Bugfix | `fix/<short-description>` | `fix/auth-redirect` |
| Infra/DevOps | `infra/<short-description>` | `infra/docker-compose-profiles` |
| Docs | `docs/<short-description>` | `docs/contributing-guide` |

## PR gates

### `feature/* → dev` (fast feedback)

Runs in `.github/workflows/feature-to-dev.yml`. PR cannot merge until green:

- Lint (`npm run lint`) — client + server
- Format check (`npm run format:check` if configured)
- Type check (`npm run typecheck`) — client + server
- Unit tests (`npm test`) — client + server
- Secrets scan (gitleaks)
- 1 PR approval

### `dev → main` (full security pipeline)

Runs in `.github/workflows/dev-to-main.yml`. Includes everything above, plus (placeholders today, enabled progressively):

- SAST — SonarQube quality gate ([sast.md](../blueprint-knowledge-base/devsecops/sast.md))
- Dependency scan — Trivy fs ([dependency-scanning.md](../blueprint-knowledge-base/devsecops/dependency-scanning.md))
- Container scan — Trivy image + Copa patch ([container-security.md](../blueprint-knowledge-base/devsecops/container-security.md))
- E2E tests — Cypress ([dast.md](../blueprint-knowledge-base/devsecops/dast.md))
- DAST — OWASP ZAP ([dast.md](../blueprint-knowledge-base/devsecops/dast.md))

Each is currently scaffolded as a `if: false` job in the workflow with a comment pointing at the runbook to enable.

## Day-to-day workflow

1. `git checkout dev && git pull`
2. `git checkout -b feature/<short-description>`
3. Develop, commit. Run checks locally before pushing:
   ```bash
   # client
   cd client && npm run lint && npm run typecheck && npm test
   # server
   cd ../server && npm run lint && npm run typecheck && npm test
   # secrets (run from repo root)
   cd .. && gitleaks detect --no-git
   ```
4. `git push -u origin feature/<short-description>`
5. Open PR to `dev` via GitHub. CI runs automatically.
6. Address review comments; merge when green + approved.
7. Periodically, someone opens a PR `dev → main`; that merge cuts a release.

## Commit messages

Short imperative subject, optional body. Examples:

```
auth: validate Keycloak JWT against JWKS
infra: add postgres init script for two-db setup
docs: explain EMAIL_PROVIDER switch
```

No Conventional Commits enforcement. Keep subjects under ~70 chars.

## GitHub branch protection (enable once after first push)

These cannot be set from code — apply them in the GitHub repo's Settings or via `gh api`. Required on both `main` and `dev`:

- Require a pull request before merging
- Require at least 1 approving review
- Require status checks to pass before merging (the workflow jobs)
- Require branches to be up to date before merging
- Disallow force pushes
- Disallow deletions

Suggested `gh api` snippet (replace `OWNER/REPO`):

```bash
gh api -X PUT "repos/OWNER/REPO/branches/dev/protection" \
  -F "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "required_status_checks[strict]=true" \
  -F "required_status_checks[contexts][]=client-checks" \
  -F "required_status_checks[contexts][]=server-checks" \
  -F "required_status_checks[contexts][]=gitleaks" \
  -F "enforce_admins=false" \
  -F "restrictions=null"
```
