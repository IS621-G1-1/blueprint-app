import { BookmarkCheck, CalendarDays, Home, ListChecks, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { BrandWordmark } from "@/components/BrandWordmark";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Planner", to: "/planner", icon: ListChecks },
  { label: "Watchlist", to: "/watchlist", icon: BookmarkCheck },
  { label: "Timetable", to: "/timetable", icon: CalendarDays },
  { label: "Profile", to: "/profile", icon: User },
];

export function TopNav() {
  return (
    <header className="border-b border-blue-400/25 bg-[#061225]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <NavLink aria-label="BlueprInT home" className="w-fit" to="/dashboard">
          <BrandWordmark className="text-2xl" />
          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-blue-100/60">
            Academic Journey Planner
          </span>
        </NavLink>

        <nav aria-label="Main navigation" className="grid grid-cols-5 gap-2 sm:flex sm:justify-end">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold text-blue-100 transition-colors sm:min-w-24",
                    isActive
                      ? "border-accent bg-accent/15 text-accent shadow-[0_0_0_1px_rgba(203,161,53,0.25)]"
                      : "border-blue-300/25 bg-blue-950/30 hover:border-accent/60 hover:bg-blue-900/45 hover:text-white",
                  )
                }
                key={item.to}
                to={item.to}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
