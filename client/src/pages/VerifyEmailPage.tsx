import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { persistAuthSession, verifyRegistration } from "@/api/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSixDigitCode, isSmuEmail } from "@/lib/validation";

interface VerifyLocationState {
  email?: string;
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => {
    const state = location.state as VerifyLocationState | null;
    return state?.email ?? searchParams.get("email") ?? "";
  }, [location.state, searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSmuEmail(email)) {
      setError("Use an SMU email ending in @smu.edu.sg.");
      return;
    }

    if (!isSixDigitCode(code)) {
      setError("Verification code must be 6 digits.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await verifyRegistration({ email, code });
      persistAuthSession(response);
      navigate("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to verify your email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      footerText="Need to restart?"
      footerLinkText="Create account"
      footerLinkTo="/register"
    >
      <Card>
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your SMU inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormError message={error} />

            <div className="space-y-2">
              <Label htmlFor="email">SMU email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify and continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
