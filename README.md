# blueprint-app

Application code for **Blueprint** — IS621 DevSecOps coursework (Group 1, SMU). A web app for SMU students to plan modules, build timetables, and discover modules through peer activity.

This repo is the **frontend + backend**. Infrastructure (Helm charts, K8s manifests, production compose stacks) lives in [`blueprint-infra`](../blueprint-infra). Architecture and DevSecOps strategy live in [`blueprint-knowledge-base`](../blueprint-knowledge-base).

## Quick start (engineers — test login in ~2 minutes)

```bash
git clone git@github.com:IS621-G1-1/blueprint-app.git
cd blueprint-app
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET.
# Leave EMAIL_PROVIDER=mailpit (default — no SendGrid account needed).

docker compose up -d
docker compose logs -f server | grep "Server running"
```

When you see `Server running on http://localhost:4000`, open the app.

| Step | URL | What you do |
|------|-----|-------------|
| 1 | http://localhost:5173 | Blueprint's login page |
| 2 | click **Create an account** | Fill in name / email / password |
| 3 | submit | "Check your email" — OTP sent |
| 4 | http://localhost:8025 | Mailpit; copy the 6-digit code |
| 5 | paste code, submit | You're auto-logged-in. HomePage shows `GET /me` |
| 6 | go to **Account** | Profile + change-password form |
| 7 | enter current + new, submit | Password updated |
| 8 | sign out, sign in with new password | Lands on home |

End users never see anything but Blueprint. The backend owns the full auth flow: bcrypt password hashing, JWT signing/verification, 6-digit OTP emails via nodemailer.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript + Tailwind |
| Backend | Express + TypeScript + Prisma + PostgreSQL |
| Auth | Backend-owned: bcrypt + JWT (HS256, 7d) + 6-digit OTP via email |
| Token storage | localStorage |
| Email (dev) | Mailpit |
| Email (live) | SendGrid (switchable via `EMAIL_PROVIDER`) |

Intentionally **not** using: Keycloak, Turborepo, pnpm workspaces, tRPC. Auth is self-contained; identity-provider integration was deemed out of scope for this coursework.

## Ports

| Port | Service |
|------|---------|
| 5173 | Frontend (nginx) |
| 4000 | Backend (Express) |
| 8025 | Mailpit web UI (see OTP emails here) |
| 1025 | Mailpit SMTP (backend connects to this) |
| 5432 | Postgres |

## Switching email to SendGrid

```bash
# Edit .env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.<your key>
SENDGRID_FROM_EMAIL=verified@example.com   # must be a SendGrid-verified sender

docker compose down
docker compose up -d
```

To get a SendGrid API key + verify a sender, see [`blueprint-knowledge-base/runbooks/keycloak-sendgrid-setup.md`](../blueprint-knowledge-base/runbooks/keycloak-sendgrid-setup.md) Part 1 (the SendGrid setup steps still apply; ignore the Keycloak realm config — we configure SMTP in the backend's `.env` now).

## Active development (HMR)

The compose-built frontend is a production artifact (nginx). For HMR:

```bash
# Keep compose running for Postgres + Mailpit + backend
docker compose up -d postgres mailpit server

# Run frontend locally
cd client
cp .env.example .env
npm install
npm run dev
```

## Repo layout

```
blueprint-app/
├── README.md, CONTRIBUTING.md, .env.example
├── docker-compose.yaml          # postgres + mailpit + server + client
├── client/                      # Vite + React frontend
└── server/                      # Express + Prisma backend
```

## Branching & PR gates

See [`CONTRIBUTING.md`](CONTRIBUTING.md). TL;DR: `feature/* → dev → main`. Light gates on `dev`, full security pipeline on `main`.

## Security considerations

- **Tokens in localStorage** — XSS-readable. Acceptable for coursework; consider httpOnly cookies for production.
- **No rate limiting** on `/auth/login` or `/auth/register/request` — easy to add (e.g., `express-rate-limit`).
- **JWT_SECRET rotation invalidates all sessions** — that's the only revocation lever today.
- **No password reset flow yet** — deferred.
- **No 2FA at login** — only at registration (email verification).

## Deferred (planned, not yet done)

| Feature | See |
|---------|-----|
| Cypress E2E | [devsecops/dast.md](../blueprint-knowledge-base/devsecops/dast.md) |
| SonarQube SAST | [devsecops/sast.md](../blueprint-knowledge-base/devsecops/sast.md) |
| Trivy fs + image scans | [devsecops/container-security.md](../blueprint-knowledge-base/devsecops/container-security.md) |
| OWASP ZAP DAST | [devsecops/dast.md](../blueprint-knowledge-base/devsecops/dast.md) |
| Helm charts / K8s manifests | [blueprint-infra/](../blueprint-infra) |
| `/modules`, `/semester-plans` REST endpoints | port from prototype |
| Password reset flow | future PR |
| Rate limiting | future PR |

## Local debugging

```bash
docker compose ps                       # all services running
docker compose logs server --tail 30
docker compose logs mailpit --tail 30

# psql into the app database
docker compose exec postgres psql -U $POSTGRES_USER -d blueprint_app

# Read all OTP emails from Mailpit (incl. extracting codes)
curl -s http://localhost:8025/api/v1/messages | jq
```
