import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
