import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, persistAuthSession } from "@/api/auth";
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

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      persistAuthSession(response);
      navigate("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleTemporaryLogin() {
    persistAuthSession({
      message: "Temporary login successful.",
      token: "temporary-dev-token",
      user: {
        id: "temporary-student",
        email: "student@mitb.smu.edu.sg",
        name: "SMU Student",
        role: "STUDENT",
      },
    });
    navigate("/dashboard");
  }

  return (
    <AuthShell
      footerText="New to BlueprInT?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
    >
      <Card>
        <CardHeader>
          <CardTitle>Student Login</CardTitle>
          <CardDescription>
            Access your academic planning workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormError message={error} />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <Button
              className="w-full border-accent/50 text-accent hover:bg-accent/10 hover:text-accent"
              type="button"
              variant="outline"
              onClick={handleTemporaryLogin}
            >
              Temporary login
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
