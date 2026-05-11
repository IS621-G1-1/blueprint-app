import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { tokenStore } from "./storage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type LoginResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: { id: string; email: string; name: string; role: string };
};

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Triggers the OTP email. Returns the email for the verify screen to use. */
  registerRequest: (name: string, email: string, password: string) => Promise<{ email: string }>;
  /** Validates the OTP, persists tokens, becomes authenticated. */
  registerVerify: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Returns the current access token (no refresh — our JWT is 7d, not auto-refreshed). */
  getAccessToken: () => Promise<string | null>;
};

const AuthCtx = createContext<AuthState | null>(null);

async function postJson<T>(path: string, body: unknown, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      /* keep raw */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as unknown as T) : ((await res.json()) as T);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(tokenStore.getAccess()));

  const persist = useCallback((access: string | null) => {
    if (access) {
      tokenStore.set(access);
      setIsAuthenticated(true);
    } else {
      tokenStore.clear();
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await postJson<LoginResponse>("/auth/login", { email, password });
      persist(data.access_token);
    },
    [persist]
  );

  const registerRequest = useCallback(async (name: string, email: string, password: string) => {
    return postJson<{ email: string }>("/auth/register/request", { name, email, password });
  }, []);

  const registerVerify = useCallback(
    async (email: string, code: string) => {
      const data = await postJson<LoginResponse>("/auth/register/verify", { email, code });
      persist(data.access_token);
    },
    [persist]
  );

  const logout = useCallback(async () => {
    persist(null);
    try {
      await postJson<void>("/auth/logout", {});
    } catch {
      /* stateless JWT — client clears regardless */
    }
  }, [persist]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return tokenStore.getAccess();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isLoading, isAuthenticated, login, registerRequest, registerVerify, logout, getAccessToken }),
    [isLoading, isAuthenticated, login, registerRequest, registerVerify, logout, getAccessToken]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
