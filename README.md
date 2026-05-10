# blueprint-app

Application code for **Blueprint** — IS621 DevSecOps coursework (Group 1, SMU). A web app for SMU students to plan modules, build timetables, and discover modules through peer activity.

This repo is the **frontend + backend**. Infrastructure (Helm charts, K8s manifests, production compose stacks) lives in [`blueprint-infra`](../blueprint-infra). Architecture and DevSecOps strategy live in [`blueprint-knowledge-base`](../blueprint-knowledge-base).

## Quick start (engineers — test login in ~2 minutes)

```bash
git clone git@github.com:IS621-G1-1/blueprint-app.git
cd blueprint-app
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, KC_BOOTSTRAP_ADMIN_PASSWORD, BACKEND_CLIENT_SECRET.
# Leave EMAIL_PROVIDER=mailpit (default — no SendGrid account needed).

docker compose up -d
docker compose logs -f keycloak | grep -E "Imported realm|Running the server"
```

Once both log lines appear (~60–90s on first run), open the app:

| Step | URL | What you do |
|------|-----|-------------|
| 1 | http://localhost:5173 | Blueprint's own login page |
| 2 | click **Create an account** | Blueprint's own registration form |
| 3 | fill in name / email / password | submit; you're auto-logged-in |
| 4 | redirected to home | HomePage shows the result of `GET /me` |
| 5 | go to **Account** | Profile + change-password form (all on Blueprint, never on Keycloak) |
| 6 | enter current + new password, submit | Password updated message |
| 7 | click **Sign out** | Back to `/login` |
| 8 | sign in with new password | Lands on home again |

End users never see Keycloak. The frontend talks only to the backend at `/auth/*`; the backend brokers all Keycloak interactions (password grant, admin API, service account).

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript + Tailwind |
| Backend | Express + TypeScript + Prisma + PostgreSQL |
| Auth flow | Custom UI on Blueprint, backend brokers Keycloak (password grant + admin API via service account) |
| Token storage | localStorage (XSS-readable — see Security tradeoffs below) |
| Email (dev) | Mailpit |
| Email (live) | SendGrid (switchable via `EMAIL_PROVIDER`) |
| JWT validation (backend) | `express-oauth2-jwt-bearer` |

Intentionally **not** using: Turborepo, pnpm workspaces, tRPC, OIDC redirect flow. Microservice-style separation between `client/` and `server/`; both are independent npm projects.

## Security tradeoffs (for graders / reviewers)

The auth pattern in this repo is **deliberately not the industry standard for SPAs.** It was chosen so end users don't see Keycloak's hosted UI. Specifically:

- **Direct Access Grants** (resource owner password credentials) — passwords flow through the Blueprint backend on every login. The standard pattern (Authorization Code + PKCE redirect to Keycloak) keeps passwords on the IdP only.
- **Tokens in `localStorage`** — readable by any JavaScript on the page; XSS exposure. The standard alternative is `httpOnly` cookies set by the backend.
- **No email verification** — accounts are created with `emailVerified: true`. Adding our own verification flow would mean reintroducing a `pending_registrations` table + nodemailer (the prototype's pattern, layered on Keycloak).
- **No MFA** — Keycloak's MFA features are bypassed because we don't surface its login UI.

A future PR could swap to Authorization Code + PKCE without breaking domain code; the auth context would be replaced, but routes and middleware are unchanged.

## Ports

| Port | Service |
|------|---------|
| 5173 | Frontend (nginx serving Vite build) |
| 4000 | Backend (Express) |
| 8080 | Keycloak admin / OIDC endpoints |
| 8025 | Mailpit web UI |
| 1025 | Mailpit SMTP (internal) |
| 5432 | Postgres (host-exposed for `psql` access) |

## Switching to SendGrid

```bash
# Edit .env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.<your key>
SENDGRID_FROM_EMAIL=verified@example.com   # must be a SendGrid-verified sender

# Reset (Keycloak only re-imports realm on a fresh DB):
docker compose down -v
docker compose up -d
```

To get a SendGrid API key + verify a sender, see [`blueprint-knowledge-base/runbooks/keycloak-sendgrid-setup.md`](../blueprint-knowledge-base/runbooks/keycloak-sendgrid-setup.md) Part 1.

## Active development (HMR)

The compose-built frontend is a production artifact (nginx). For active development with hot reload:

```bash
# Keep the compose stack running for Postgres + Keycloak + Mailpit + backend
docker compose up -d postgres mailpit realm-render keycloak server

# Run frontend locally (HMR at localhost:5173)
cd client
cp .env.example .env
npm install
npm run dev
```

The `client/.env` defaults work against the dockerized Keycloak + backend.

## Repo layout

```
blueprint-app/
├── README.md, CONTRIBUTING.md, .env.example
├── docker-compose.yaml          # full local stack (postgres + keycloak + mailpit + server + client)
├── realm-export/                # Keycloak realm template + render script (Mailpit / SendGrid)
├── scripts/postgres-init.sql    # creates blueprint_app + keycloak databases
├── client/                      # Vite + React frontend
├── server/                      # Express + Prisma backend
└── .github/                     # PR template + workflows (feature→dev, dev→main)
```

## Branching & PR gates

See [`CONTRIBUTING.md`](CONTRIBUTING.md). TL;DR: `feature/* → dev → main`. Light gates on `dev`, full security pipeline on `main`.

## Deferred (planned, not yet done)

| Feature | Owner / Status | See |
|---------|----------------|-----|
| Cypress E2E | placeholder workflow job | [devsecops/dast.md](../blueprint-knowledge-base/devsecops/dast.md) |
| SonarQube SAST | placeholder workflow job | [devsecops/sast.md](../blueprint-knowledge-base/devsecops/sast.md) |
| Trivy fs + image scans, Copa patching | placeholder workflow job | [devsecops/container-security.md](../blueprint-knowledge-base/devsecops/container-security.md) |
| OWASP ZAP DAST | placeholder workflow job | [devsecops/dast.md](../blueprint-knowledge-base/devsecops/dast.md) |
| Helm charts / K8s manifests | not in this repo | [blueprint-infra/](../blueprint-infra) |
| `/modules`, `/semester-plans` REST endpoints | port from prototype | `blueprint/server/src/routes/` |
| Worker service (activity processor) | not yet built | [system-architecture.md](../blueprint-knowledge-base/architecture/system-architecture.md) |
| SMU email-domain restriction | needs Keycloak user-profile validator | follow-up runbook |

## Local debugging

```bash
docker compose ps                       # all services running, realm-render exited 0
docker compose logs realm-render        # "Rendered realm for EMAIL_PROVIDER=..."
docker compose logs keycloak --tail 30  # check for "Imported realm" / "Running the server"
docker compose logs server --tail 30    # check for "Server running on http://localhost:4000"

# Inspect rendered realm JSON (lives in a Docker volume)
docker compose run --rm --no-deps --entrypoint cat keycloak \
  /opt/keycloak/data/import/blueprint-realm.json | jq

# psql into either database
docker compose exec postgres psql -U $POSTGRES_USER -d blueprint_app
docker compose exec postgres psql -U $POSTGRES_USER -d keycloak
```
