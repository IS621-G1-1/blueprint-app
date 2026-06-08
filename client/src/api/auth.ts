const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000";

export type UserRole = "STUDENT" | string;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface RegisterRequestPayload {
  name: string;
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  password: string;
}

export interface MessageResponse {
  message: string;
}

export interface AuthSuccessResponse extends MessageResponse {
  token: string;
  user: AuthUser;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  const data = (await response.json().catch(() => ({}))) as TResponse | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error ?? errorData.message ?? "Something went wrong. Please try again.",
      response.status,
    );
  }

  return data as TResponse;
}

async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as
    | TResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error ??
        errorData.message ??
        "Something went wrong. Please try again.",
      response.status,
    );
  }

  return data as TResponse;
}

export function requestRegistration(payload: RegisterRequestPayload) {
  return postJson<MessageResponse, RegisterRequestPayload>(
    "/auth/register/request",
    {
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim(),
    },
  );
}

export function verifyRegistration(payload: VerifyEmailPayload) {
  return postJson<AuthSuccessResponse, VerifyEmailPayload>(
    "/auth/register/verify",
    {
      ...payload,
      email: payload.email.trim(),
      code: payload.code.trim(),
    },
  );
}

export function login(payload: LoginPayload) {
  return postJson<AuthSuccessResponse, LoginPayload>("/auth/login", {
    ...payload,
    email: payload.email.trim(),
  });
}

export function getAuthHeaders() {
  const token = localStorage.getItem("blueprint_token");
  return {
    Authorization: `Bearer ${token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return parseResponse<MessageResponse>(response);
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse<MessageResponse>(response);
}

export async function deleteAccount(payload: DeleteAccountPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse<MessageResponse>(response);
}

export function persistAuthSession(response: AuthSuccessResponse) {
  localStorage.setItem("blueprint_token", response.token);
  localStorage.setItem("blueprint_user", JSON.stringify(response.user));
}

export function readStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem("blueprint_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem("blueprint_token");
  localStorage.removeItem("blueprint_user");
}
