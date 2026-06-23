import { FormEvent, useState } from "react";
import { AlertTriangle, LogOut, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  changePassword,
  clearAuthSession,
  deleteAccount,
  logout,
  readStoredUser,
} from "@/api/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LENGTH = 12;

//test branch changes

export function Profile() {
  const navigate = useNavigate();
  const user = readStoredUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function finishSession() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      finishSession();
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePassword({ currentPassword, newPassword });
      setMessage(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      clearAuthSession();
      window.setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change password. Please try again.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDeleteAccount() {
    setIsDeletingAccount(true);

    try {
      await deleteAccount({ password: deletePassword });
      finishSession();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete account. Please try again.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function closeDeleteDialog() {
    if (!isDeletingAccount) {
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Card className="border-blue-400/35 bg-card/90">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
            <User className="h-5 w-5" />
          </div>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-blue-400/25 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="mt-1 font-medium">{user?.name ?? "Unknown"}</p>
            </div>
            <div className="rounded-md border border-blue-400/25 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 break-words font-medium">{user?.email ?? "Unknown"}</p>
            </div>
            <div className="rounded-md border border-blue-400/25 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="mt-1 font-medium">{user?.role ?? "Unknown"}</p>
            </div>
          </div>

          <form className="space-y-4 border-t border-blue-400/25 pt-6" onSubmit={handleChangePassword}>
            <div>
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  autoComplete="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  autoComplete="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <Input
                  id="confirm-new-password"
                  autoComplete="new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change password"}
            </Button>
          </form>

          <form className="space-y-4 border-t border-blue-400/25 pt-6" onSubmit={handleDeleteAccount}>
            <div>
              <h2 className="text-lg font-semibold">Delete Account</h2>
            </div>

            <div className="max-w-sm space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                autoComplete="current-password"
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="destructive" disabled={isDeletingAccount}>
              {isDeletingAccount ? "Deleting..." : "Delete account"}
            </Button>
          </form>

          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>

      {isDeleteDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            aria-describedby="delete-account-dialog-description"
            aria-labelledby="delete-account-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-md border border-destructive/40 bg-card p-6 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-account-dialog-title" className="text-lg font-semibold">
                  Delete account?
                </h2>
                <p
                  id="delete-account-dialog-description"
                  className="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  This will permanently delete your account and sign you out. This action cannot be
                  undone.
                </p>
              </div>
              <Button
                aria-label="Close delete account confirmation"
                className="-mr-2 -mt-2"
                disabled={isDeletingAccount}
                onClick={closeDeleteDialog}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={isDeletingAccount}
                onClick={closeDeleteDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isDeletingAccount}
                onClick={confirmDeleteAccount}
                type="button"
                variant="destructive"
              >
                {isDeletingAccount ? "Deleting..." : "Yes, delete account"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
