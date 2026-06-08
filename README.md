# blueprint-app

Application code for **BlueprInT** — IS621 DevSecOps coursework (Group 1, SMU). A web app for SMU students to plan modules, build semester plans, and track graduation requirements.

This repo is the **frontend + backend**. Infrastructure (Helm charts, K8s manifests) lives in [`blueprint-infra`](../blueprint-infra). Architecture and DevSecOps strategy live in [`blueprint-knowledge-base`](../blueprint-knowledge-base).

## Quick start (~2 minutes to running app)

```bash
git clone git@github.com:IS621-G1-1/blueprint-app.git
cd blueprint-app
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET
docker compose up -d
```

| Step | URL | What you do |
|------|-----|-------------|
| 1 | http://localhost:5173 | BlueprInT login page |
| 2 | click **Create an account** | Fill in name / SMU email / password |
| 3 | submit | "Check your email" — OTP sent |
| 4 | http://localhost:8025 | Mailpit; copy the 6-digit code |
| 5 | paste code, submit | Logged in. Home page shows graduation requirements + plan overview |
| 6 | click **Planner** | Search modules and build semester plans |
| 7 | click **Profile** | View your name, email, role |
| 8 | sign out, sign in again | Lands on home |

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript + Tailwind + shadcn/ui |
| Backend | Express + TypeScript + Prisma + PostgreSQL |
| Auth | bcrypt password hashing + JWT (HS256, 7d) + 6-digit OTP via email |
| Token storage | localStorage |
| Email (dev) | Mailpit |
| Email (live) | Gmail via nodemailer (switchable via `EMAIL_PROVIDER`) |

## Ports

| Port | Service |
|------|---------|
| 5173 | Frontend (nginx) |
| 4000 | Backend (Express) |
| 8025 | Mailpit web UI (read OTP emails here) |
| 1025 | Mailpit SMTP |
| 5432 | Postgres |

## Repo layout

```
blueprint-app/
├── .env.example                 # copy to .env and fill in secrets
├── docker-compose.yaml          # postgres + mailpit + server + client
├── client/                      # Vite + React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── pages/               # Home, Login, Register, VerifyEmail, Planner, Timetable, Profile
│       ├── components/          # layout, dashboard, auth, ui (shadcn)
│       ├── api/                 # auth.ts, modules.ts, semesterPlans.ts
│       ├── config/              # graduationRequirements.ts
│       └── types/               # planner.ts
└── server/                      # Express + Prisma backend
    ├── Dockerfile
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts              # run manually: npx tsx prisma/seed.ts
    │   └── migrations/          # includes auto-seed migration for module catalogue
    └── src/
        ├── routes/              # auth, modules, semester-plans
        ├── middleware/          # requireAuth (JWT verification)
        └── lib/                 # jwt, email, prisma, verificationCode
```

## Switching email to Gmail

```bash
# Edit .env
EMAIL_PROVIDER=gmail
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # Google App Password

docker compose up -d --build server
```

> Gmail requires a [Google App Password](https://myaccount.google.com/apppasswords) — not your account password. 2FA must be enabled on the Google account.

## Active development (HMR)

The compose-built frontend is a production nginx artifact. For HMR:

```bash
# Keep backend + postgres + mailpit running
docker compose up -d postgres mailpit server

# Run frontend locally
cd client
cp .env.example .env          # sets VITE_API_BASE_URL=http://localhost:4000
npm install
npm run dev
```

## Branching strategy

```
feature/*  ──►  dev  ──►  main
```

| Branch | Protection | Who can push |
|--------|-----------|--------------|
| `main` | PR required · 1 approval · all status checks · GPG signed commits | Admins only (bypass) |
| `dev` | PR required · 1 approval · all status checks · GPG signed commits | Admins only (bypass) |
| `feature/*` | None | Anyone |

## CI pipelines

### `feature/* → dev` (`feature-to-dev.yml`)

Runs on every PR targeting `dev`. All three checks must pass before merge is allowed.

| Job | What it does |
|-----|-------------|
| `client (lint + typecheck + test)` | `eslint` · `tsc -b` · Vitest unit tests |
| `server (lint + typecheck + test)` | `tsc --noEmit` · Vitest unit tests |
| `gitleaks (secret scan)` | Scans PR commits for leaked secrets |

### `dev → main` (`dev-to-main.yml`)

Runs on every PR targeting `main`. Includes all `feature-to-dev` gates plus the E2E job.

| Job | What it does |
|-----|-------------|
| `client (lint + typecheck + test)` | Same as above |
| `server (lint + typecheck + test)` | Same as above |
| `gitleaks (secret scan)` | Same as above |
| `E2E — Playwright` | Builds full stack via `docker compose`, seeds test user, runs 6 browser tests |
| `SAST — SonarQube` | Placeholder — `if: false` |
| `SCA — Trivy filesystem` | Placeholder — `if: false` |
| `Container — Trivy + Copa` | Placeholder — `if: false` |
| `DAST — OWASP ZAP` | Placeholder — `if: false` |

### Merge to `main` → release (`release.yml`)

Triggers automatically after every merge to `main`.

1. Reads the `bump:patch` / `bump:minor` / `bump:major` label from the merged PR (defaults to `patch`)
2. Increments the latest semver tag (e.g. `v0.0.1` → `v0.0.2`)
3. Builds `client` and `server` Docker images with layer caching
4. Pushes to GHCR with the version tag and `latest`
5. Creates a GitHub Release with auto-generated notes

## Tests

### Unit tests (Vitest)

```bash
cd client && npm test    # validation helpers, graduation requirement logic
cd server && npm test    # isSmuEmail, verificationCode generate/hash/verify
```

### E2E tests (Playwright)

Requires `docker compose up` to be running.

```bash
cd client && npm run test:e2e
```

| Spec | Covers |
|------|--------|
| `e2e/auth.spec.ts` | Login → dashboard redirect · invalid password error · unknown email error |
| `e2e/protected.spec.ts` | Unauthenticated redirect to `/login` · authenticated nav between routes |

## Releases and Docker images

### Labelling PRs

Apply exactly one bump label when opening a PR to `main`:

| Label | When to use | Example |
|-------|------------|---------|
| `bump:patch` | Bug fixes, copy changes, CI tweaks | `v0.0.1` → `v0.0.2` |
| `bump:minor` | New features, non-breaking additions | `v0.0.2` → `v0.1.0` |
| `bump:major` | Breaking changes | `v0.1.0` → `v1.0.0` |

If no label is applied the pipeline defaults to `patch`.

### Viewing published images

Images are published to the GitHub Container Registry after every merge to `main`.

**GitHub UI:** https://github.com/orgs/IS621-G1-1/packages

```bash
# Pull a specific version
docker pull ghcr.io/is621-g1-1/blueprint-app/client:v0.0.1
docker pull ghcr.io/is621-g1-1/blueprint-app/server:v0.0.1

# Always latest
docker pull ghcr.io/is621-g1-1/blueprint-app/client:latest
docker pull ghcr.io/is621-g1-1/blueprint-app/server:latest
```

> **Note:** After the first release, set image visibility to **Private** in the package settings at https://github.com/orgs/IS621-G1-1/packages.

## Security considerations

- **Tokens in localStorage** — XSS-readable. Acceptable for coursework; httpOnly cookies for production.
- **No rate limiting** on `/auth/login` or `/auth/register/request` — add `express-rate-limit` when needed.
- **JWT_SECRET rotation invalidates all sessions** — only revocation lever today.
- **No password reset flow** — deferred.
- **SMU email enforced at registration** — `smu.edu.sg` domain check in `RegisterPage` and `auth.routes.ts`.

## Local debugging

```bash
docker compose ps
docker compose logs server --tail 30
docker compose logs mailpit --tail 30

# psql into the app database
docker compose exec postgres psql -U blueprint -d blueprint_db

# Read OTP emails via Mailpit API
curl -s http://localhost:8025/api/v1/messages | jq '.[0].Content.Body'
```

## Deferred (planned, not yet done)

| Feature | Notes |
|---------|-------|
| SonarQube SAST | Placeholder job in `dev-to-main.yml` — see `blueprint-knowledge-base/devsecops/sast.md` |
| Trivy image scans | Placeholder job in `dev-to-main.yml` — see `blueprint-knowledge-base/devsecops/container-security.md` |
| OWASP ZAP DAST | Placeholder job in `dev-to-main.yml` — see `blueprint-knowledge-base/devsecops/dast.md` |
| Helm charts / K8s manifests | [`blueprint-infra/`](../blueprint-infra) |
| Password reset flow | Future PR |
| Rate limiting | Future PR |
| Timetable view | Stub page — calendar integration deferred |
