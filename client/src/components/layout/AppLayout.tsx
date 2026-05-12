import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#061225_0%,#0a1a33_52%,#050913_100%)] text-foreground">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
