// fetch wrapper used by route components. Calls the AuthContext for an access
// token (which transparently refreshes if needed) and injects it as a Bearer.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type GetAccessToken = () => Promise<string | null>;

export async function apiFetch<T = unknown>(
  path: string,
  getAccessToken: GetAccessToken,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      /* keep raw */
    }
    throw new ApiError(msg || res.statusText, res.status);
  }
  return res.status === 204 ? (undefined as unknown as T) : ((await res.json()) as T);
}
