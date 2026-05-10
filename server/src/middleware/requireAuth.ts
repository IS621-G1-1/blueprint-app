import { auth } from "express-oauth2-jwt-bearer";

// Validates the incoming Bearer JWT against Keycloak's JWKS.
// Checks: signature (via JWKS), issuer (`iss`), audience (`aud`), expiry (`exp`).
//
// On success: attaches `req.auth.payload` with the decoded claims (sub, email, etc.).
// On failure: responds 401 with a WWW-Authenticate header (lib handles this).
//
// Issuer URL split: tokens are minted by Keycloak with `iss=http://localhost:8080/...`
// (the browser-facing URL). The backend container can't reach `localhost:8080` —
// inside the container, localhost is the server itself. So we provide:
//   - `issuer`  : the URL the backend EXPECTS in the `iss` claim (browser-facing)
//   - `jwksUri` : the URL the backend FETCHES keys from (container-internal)
// Providing both bypasses the OIDC discovery fetch (which would otherwise try
// to hit the browser-facing URL from inside the container).

export const requireAuth = auth({
  issuer: process.env.KEYCLOAK_ISSUER,
  jwksUri: process.env.KEYCLOAK_JWKS_URI,
  audience: process.env.KEYCLOAK_AUDIENCE,
  tokenSigningAlg: "RS256",
});
