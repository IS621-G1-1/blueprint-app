import { useEffect, useMemo, useState } from "react";
import { readStoredUser } from "@/api/auth";
import { getSemesterPlans } from "@/api/semesterPlans";
import { GuidedEmptyDashboard } from "@/components/dashboard/GuidedEmptyDashboard";
import { PlanOverview } from "@/components/dashboard/PlanOverview";
import { RequirementsCheck } from "@/components/dashboard/RequirementsCheck";
import type { SemesterPlan } from "@/types/planner";

export function Home() {
  const user = readStoredUser();
  const name = user?.name ?? "student";
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPlans() {
      try {
        const plans = await getSemesterPlans();

        if (isMounted) {
          setSemesterPlans(plans);
        }
      } catch {
        if (isMounted) {
          setSemesterPlans([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      }
    }

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasPlanData = useMemo(
    () => semesterPlans.some((plan) => plan.plannedModules.length > 0),
    [semesterPlans],
  );
  const showGuidedEmptyState = !isLoadingPlans && user?.role === "STUDENT" && !hasPlanData;

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-blue-400/30 bg-blue-950/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Home
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-white">
          Welcome back, {name}. Here is your projected path to graduation.
        </h1>
      </section>

      {showGuidedEmptyState ? (
        <GuidedEmptyDashboard />
      ) : (
        <>
          <RequirementsCheck />
          <PlanOverview isLoading={isLoadingPlans} semesterPlans={semesterPlans} />
        </>
      )}
    </div>
  );
}
