# Realm export

Auto-import for the Keycloak `blueprint` realm.

## Files

| File | Role |
|------|------|
| `blueprint-realm.template.json` | Realm config with `${SMTP_*}` placeholders. Includes both clients (`blueprint-app-frontend`, `blueprint-app-backend`). Committed. |
| `render.sh` | Switches `${SMTP_*}` env vars based on `EMAIL_PROVIDER`, runs `envsubst`. Committed. |
| (rendered output) | `blueprint-realm.json` written to a Docker volume, never to disk. Imported by Keycloak on first start. |

## How it works

```
.env (EMAIL_PROVIDER, SENDGRID_*, SMTP_FROM_EMAIL)
        │
        ▼
realm-render service (alpine + envsubst)
   └── runs render.sh
       ├── case EMAIL_PROVIDER:
       │     mailpit  → SMTP_HOST=mailpit, port=1025, auth=false
       │     sendgrid → SMTP_HOST=smtp.sendgrid.net, port=587, auth=true
       └── envsubst < template > /out/blueprint-realm.json
        │
        ▼
Keycloak (--import-realm reads /opt/keycloak/data/import/*.json)
```

## Switching email providers

Keycloak only re-imports realms on a fresh database. To pick up template changes
or change `EMAIL_PROVIDER`:

```bash
docker compose down -v
docker compose up -d
```

## Don't commit the rendered output

`docker-compose.yaml` writes the rendered JSON to a named Docker volume
(`realm_import`), not to a file in this directory. So there's nothing to
gitignore — by design, the populated realm config (with SendGrid API key) never
touches your filesystem.

If you ever export a realm by hand (`kc.sh export`), the result will be on disk
— inspect for secrets and **do not commit** unless they're scrubbed.
