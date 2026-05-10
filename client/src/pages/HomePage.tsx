import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
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
    if (!auth.user?.access_token) return;

    apiFetch<Me>("/me", auth.user.access_token)
      .then(setMe)
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(`/me failed: HTTP ${err.status} — ${err.message}`);
        else setError(String(err));
      });
  }, [auth.user?.access_token]);

  const profile = auth.user?.profile;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Hello, {profile?.name ?? profile?.email}</h1>
        <p className="mt-1 text-sm text-slate-400">
          You're signed in via Keycloak. The boxes below prove the full token round-trip works.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium">id_token claims (from Keycloak)</h2>
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-300">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </section>

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
