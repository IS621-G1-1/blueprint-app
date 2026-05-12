import { readStoredUser } from "@/api/auth";
import { PlanOverview } from "@/components/dashboard/PlanOverview";
import { RequirementsCheck } from "@/components/dashboard/RequirementsCheck";

export function Home() {
  const user = readStoredUser();
  const name = user?.name ?? "student";

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-blue-400/30 bg-blue-950/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Home
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-white">
          Hello {name}, here is your projected path to graduation
        </h1>
      </section>

      <RequirementsCheck />
      <PlanOverview />
    </div>
  );
}
