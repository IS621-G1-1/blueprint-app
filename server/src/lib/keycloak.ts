// Keycloak client wrapper. Used by /auth routes to broker login, register, and
// password change. Centralizes the URL construction and the service-account
// token caching so route handlers stay clean.

const baseUrl = process.env.KEYCLOAK_BASE_URL!;
const realm = process.env.KEYCLOAK_REALM!;
const clientId = process.env.KEYCLOAK_CLIENT_ID!;
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;

if (!baseUrl || !realm || !clientId || !clientSecret) {
  throw new Error("KEYCLOAK_BASE_URL / _REALM / _CLIENT_ID / _CLIENT_SECRET must be set");
}

const tokenEndpoint = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
const adminBase = `${baseUrl}/admin/realms/${realm}`;
const logoutEndpoint = `${baseUrl}/realms/${realm}/protocol/openid-connect/logout`;

export type KeycloakTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
};

export class KeycloakError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function postForm(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === "object" && body && "error_description" in body
      ? String((body as { error_description: string }).error_description)
      : `Keycloak ${res.status}`;
    throw new KeycloakError(msg, res.status, body);
  }
  return body;
}

// --- Service-account token (cached, used for admin API calls) ---

let cached: { token: string; expiresAt: number } | null = null;

async function serviceAccountToken(): Promise<string> {
  // Refresh ~30s before actual expiry to avoid races
  if (cached && cached.expiresAt - 30_000 > Date.now()) return cached.token;

  const data = (await postForm(tokenEndpoint, {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })) as KeycloakTokenResponse;

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await serviceAccountToken();
  return fetch(`${adminBase}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// --- Public API used by /auth routes ---

export async function passwordGrant(email: string, password: string): Promise<KeycloakTokenResponse> {
  return (await postForm(tokenEndpoint, {
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username: email,
    password,
    scope: "openid profile email",
  })) as KeycloakTokenResponse;
}

export async function refreshToken(refresh_token: string): Promise<KeycloakTokenResponse> {
  return (await postForm(tokenEndpoint, {
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token,
  })) as KeycloakTokenResponse;
}

export async function revokeRefreshToken(refresh_token: string): Promise<void> {
  // Keycloak's logout endpoint invalidates the refresh token + session
  await postForm(logoutEndpoint, {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token,
  });
}

// Creates a Keycloak user. Returns the new user's UUID.
// emailVerified is set to true so users can log in immediately (verification flow deferred).
export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<string> {
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const res = await adminFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      username: input.email,
      email: input.email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: "password", value: input.password, temporary: false }],
    }),
  });

  if (res.status === 201) {
    // Keycloak returns the new ID in the Location header
    const loc = res.headers.get("location") ?? "";
    return loc.split("/").pop() ?? "";
  }
  if (res.status === 409) {
    throw new KeycloakError("Email is already registered", 409, await res.json().catch(() => null));
  }
  const body = await res.json().catch(() => ({}));
  throw new KeycloakError("Failed to create user", res.status, body);
}

export async function getUserByKeycloakId(id: string): Promise<{ id: string; email: string; firstName?: string; lastName?: string } | null> {
  const res = await adminFetch(`/users/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new KeycloakError("Failed to fetch user", res.status, await res.json().catch(() => null));
  return res.json() as Promise<{ id: string; email: string; firstName?: string; lastName?: string }>;
}

// Resets a user's password via the admin API. Doesn't require knowing the current
// password — but the route handler ensures the caller is authenticated as that user
// AND verifies their current password by attempting a passwordGrant first.
export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const res = await adminFetch(`/users/${userId}/reset-password`, {
    method: "PUT",
    body: JSON.stringify({ type: "password", value: newPassword, temporary: false }),
  });
  if (!res.ok) {
    throw new KeycloakError("Failed to reset password", res.status, await res.json().catch(() => null));
  }
}
