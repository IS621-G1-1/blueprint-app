import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, readStoredUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Profile() {
  const navigate = useNavigate();
  const user = readStoredUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
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

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
