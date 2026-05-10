import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

// Reads VITE_KEYCLOAK_* at build time. Vite inlines these into the bundle, so the
// values are baked into the dist artifact — change them in client/.env (dev) or
// at build time when the docker image is built.

const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

if (!url || !realm || !clientId) {
  throw new Error("VITE_KEYCLOAK_URL / _REALM / _CLIENT_ID must be set");
}

export const oidcConfig: AuthProviderProps = {
  authority: `${url}/realms/${realm}`,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  response_type: "code",
  scope: "openid profile email",
  // Persist tokens across reloads. localStorage is fine for a coursework demo;
  // sessionStorage would be slightly stricter against XSS persistence.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Strip ?code=&state= from URL after the OIDC callback completes.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
