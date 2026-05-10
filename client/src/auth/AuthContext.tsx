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

type TokenSet = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Returns the current access token, refreshing first if it's expiring soon. */
  getAccessToken: () => Promise<string | null>;
};

const AuthCtx = createContext<AuthState | null>(null);

// Decode a JWT payload without verification. Used only to read the `exp` claim
// for proactive refresh — never to make trust decisions.
function decodeExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

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
  // The component-level state mirrors what's in localStorage so React rerenders
  // when tokens change. localStorage is the source of truth across reloads.
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(tokenStore.getAccess()));
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((tokens: TokenSet | null) => {
    if (tokens) {
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      setIsAuthenticated(true);
    } else {
      tokenStore.clear();
      setIsAuthenticated(false);
    }
  }, []);

  // On mount, do nothing fancy — just acknowledge what's in storage.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const tokens = await postJson<TokenSet>("/auth/login", { email, password });
        persist(tokens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      }
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        const tokens = await postJson<TokenSet>("/auth/register", { name, email, password });
        persist(tokens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      }
    },
    [persist]
  );

  const logout = useCallback(async () => {
    const refresh_token = tokenStore.getRefresh();
    persist(null);
    if (refresh_token) {
      try {
        await postJson<void>("/auth/logout", { refresh_token });
      } catch {
        /* best-effort; tokens are already cleared client-side */
      }
    }
  }, [persist]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const access = tokenStore.getAccess();
    if (!access) return null;

    const exp = decodeExp(access);
    const now = Math.floor(Date.now() / 1000);

    // Refresh proactively if the access token is within 30s of expiry.
    if (exp && exp - now > 30) return access;

    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      persist(null);
      return null;
    }

    try {
      const fresh = await postJson<TokenSet>("/auth/refresh", { refresh_token: refresh });
      persist(fresh);
      return fresh.access_token;
    } catch {
      persist(null);
      return null;
    }
  }, [persist]);

  const value = useMemo<AuthState>(
    () => ({ isLoading, isAuthenticated, error, login, register, logout, getAccessToken }),
    [isLoading, isAuthenticated, error, login, register, logout, getAccessToken]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
