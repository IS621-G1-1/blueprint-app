import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetch, ApiError } from "@/api/client";

type Me = {
  id: string;
  email: string;
  name: string;
  role: string;
  keycloakId: string;
  createdAt: string;
};

export function HomePage() {
  const auth = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Me>("/me", auth.getAccessToken)
      .then(setMe)
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(`/me failed: HTTP ${err.status} — ${err.message}`);
        else setError(String(err));
      });
  }, [auth.getAccessToken]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Hello, {me?.name ?? "there"}</h1>
        <p className="mt-1 text-sm text-slate-400">
          You're signed in. The block below shows your profile from the backend.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium">GET /me (your local User row)</h2>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-300">
          {me ? JSON.stringify(me, null, 2) : "Loading…"}
        </pre>
      </section>
    </div>
  );
}
