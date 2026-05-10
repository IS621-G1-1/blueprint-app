import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";

type Me = { name: string; email: string };

export function TopNav() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    apiFetch<Me>("/me", auth.getAccessToken).then(setMe).catch(() => setMe(null));
  }, [auth.isAuthenticated, auth.getAccessToken]);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Blueprint
        </Link>

        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
            }
          >
            Account
          </NavLink>

          {me && <span className="text-sm text-slate-500">{me.name}</span>}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
