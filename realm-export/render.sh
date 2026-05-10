#!/bin/sh
# Renders blueprint-realm.template.json into blueprint-realm.json with the
# right SMTP block based on EMAIL_PROVIDER. Run by the realm-render service
# in docker-compose.yaml — see that file for the volume layout.
#
# Inputs (from .env via compose):
#   EMAIL_PROVIDER         "mailpit" | "sendgrid"
#   SMTP_FROM_EMAIL        only used by Mailpit (cosmetic)
#   SENDGRID_API_KEY       required when EMAIL_PROVIDER=sendgrid
#   SENDGRID_FROM_EMAIL    required when EMAIL_PROVIDER=sendgrid
#
# Outputs:
#   /out/blueprint-realm.json   shared volume that Keycloak imports from

set -eu

apk add --no-cache gettext > /dev/null 2>&1

case "${EMAIL_PROVIDER:-mailpit}" in
  mailpit)
    export SMTP_HOST="mailpit"
    export SMTP_PORT="1025"
    export SMTP_USER=""
    export SMTP_PASSWORD=""
    export SMTP_AUTH="false"
    export SMTP_STARTTLS="false"
    export SMTP_FROM_EMAIL="${SMTP_FROM_EMAIL:-noreply@blueprint.local}"
    ;;
  sendgrid)
    : "${SENDGRID_API_KEY:?SENDGRID_API_KEY required when EMAIL_PROVIDER=sendgrid}"
    : "${SENDGRID_FROM_EMAIL:?SENDGRID_FROM_EMAIL required when EMAIL_PROVIDER=sendgrid}"
    export SMTP_HOST="smtp.sendgrid.net"
    export SMTP_PORT="587"
    export SMTP_USER="apikey"
    export SMTP_PASSWORD="${SENDGRID_API_KEY}"
    export SMTP_AUTH="true"
    export SMTP_STARTTLS="true"
    export SMTP_FROM_EMAIL="${SENDGRID_FROM_EMAIL}"
    ;;
  *)
    echo "Unknown EMAIL_PROVIDER: ${EMAIL_PROVIDER}" >&2
    exit 1
    ;;
esac

envsubst '$SMTP_HOST $SMTP_PORT $SMTP_USER $SMTP_PASSWORD $SMTP_AUTH $SMTP_STARTTLS $SMTP_FROM_EMAIL' \
  < /template/blueprint-realm.template.json \
  > /out/blueprint-realm.json

bytes=$(wc -c < /out/blueprint-realm.json)
echo "Rendered realm for EMAIL_PROVIDER=${EMAIL_PROVIDER} (${bytes} bytes)"
