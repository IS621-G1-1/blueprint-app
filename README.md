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

## Branching & PR gates

`feature/* → dev → main`. Light gates on `dev` (lint, typecheck, test, gitleaks). Full security pipeline on `main` (+ SAST, Trivy, Cypress, ZAP placeholders).

See [`CONTRIBUTING.md`](../blueprint-knowledge-base) and [`.github/workflows/`](.github/workflows/).

## Security considerations

- **Tokens in localStorage** — XSS-readable. Acceptable for coursework; httpOnly cookies for production.
- **No rate limiting** on `/auth/login` or `/auth/register/request` — add `express-rate-limit` when needed.
- **JWT_SECRET rotation invalidates all sessions** — only revocation lever today.
- **No password reset flow** — deferred.
- **SMU email enforced at registration** — `@smu.edu.sg` check in `RegisterPage` and `auth.routes.ts`.

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
| Cypress E2E | Placeholder job in `dev-to-main.yml` |
| SonarQube SAST | Placeholder job in `dev-to-main.yml` |
| Trivy image scans | Placeholder job in `dev-to-main.yml` |
| OWASP ZAP DAST | Placeholder job in `dev-to-main.yml` |
| Helm charts / K8s manifests | [`blueprint-infra/`](../blueprint-infra) |
| Password reset flow | Future PR |
| Rate limiting | Future PR |
| Timetable view | Stub page — calendar integration deferred |
