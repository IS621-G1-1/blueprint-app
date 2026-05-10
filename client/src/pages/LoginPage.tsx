import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

export function LoginPage() {
  const auth = useAuth();

  if (auth.isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/60 p-8">
        <h1 className="text-2xl font-semibold">Welcome to Blueprint</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in or register through Keycloak to continue.
        </p>

        <button
          type="button"
          onClick={() => auth.signinRedirect()}
          className="mt-6 w-full rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Sign in with Keycloak
        </button>

        {auth.error && (
          <p className="mt-4 text-sm text-red-400">Auth error: {auth.error.message}</p>
        )}
      </div>
    </div>
  );
}
