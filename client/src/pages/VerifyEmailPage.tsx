import { FormEvent, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { FormField } from "@/components/ui/FormField";

export function VerifyEmailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (auth.isAuthenticated) return <Navigate to="/" replace />;
  if (!email) return <Navigate to="/register" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await auth.registerVerify(email, code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/60 p-8">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-1 text-sm text-slate-400">
          We sent a 6-digit code to <span className="text-slate-200">{email}</span>. Enter it below.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <FormField
            label="Verification code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
          />

          {error && (
            <p className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Verify"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Code expires in 15 minutes. Didn't get it? Re-register to send a new one.
        </p>
      </div>
    </div>
  );
}
