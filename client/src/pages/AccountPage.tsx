import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetch, ApiError } from "@/api/client";
import { FormField } from "@/components/ui/FormField";

type Me = { id: string; email: string; name: string; role: string };

export function AccountPage() {
  const auth = useAuth();
  const [me, setMe] = useState<Me | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Me>("/me", auth.getAccessToken).then(setMe).catch(() => setMe(null));
  }, [auth.getAccessToken]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/auth/change-password", auth.getAccessToken, {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setSuccess("Password updated. You can keep using your current session.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-1 text-sm text-slate-400">Your profile and password.</p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium">Profile</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex">
            <dt className="w-24 text-slate-500">Name</dt>
            <dd className="text-slate-200">{me?.name ?? "—"}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-slate-500">Email</dt>
            <dd className="text-slate-200">{me?.email ?? "—"}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-slate-500">Role</dt>
            <dd className="text-slate-200">{me?.role ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-medium">Change password</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <FormField
            label="Current password"
            type="password"
            name="current_password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <FormField
            label="New password"
            type="password"
            name="new_password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
          <FormField
            label="Confirm new password"
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />

          {error && (
            <p className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
