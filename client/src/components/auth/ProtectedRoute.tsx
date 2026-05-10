import { useAuth } from "react-oidc-context";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-300">Loading…</div>;
  }

  if (auth.error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        Auth error: {auth.error.message}
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
