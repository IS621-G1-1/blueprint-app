const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const ACCOUNT_CONSOLE = `${KEYCLOAK_URL}/realms/${REALM}/account`;

export function AccountPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Profile, password, and email management are handled by Keycloak's account console.
        </p>
      </header>

      <a
        href={ACCOUNT_CONSOLE}
        target="_blank"
        rel="noreferrer"
        className="inline-block rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Open Keycloak account console →
      </a>

      <p className="text-xs text-slate-500">
        Opens in a new tab: {ACCOUNT_CONSOLE}
      </p>
    </div>
  );
}
