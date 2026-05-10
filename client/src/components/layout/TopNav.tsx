import { Link, NavLink } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export function TopNav() {
  const auth = useAuth();
  const userName = auth.user?.profile.name ?? auth.user?.profile.email ?? "user";

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

          {auth.isAuthenticated && (
            <>
              <span className="text-sm text-slate-500">{userName}</span>
              <button
                type="button"
                onClick={() =>
                  auth.signoutRedirect({ post_logout_redirect_uri: `${window.location.origin}/login` })
                }
                className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
