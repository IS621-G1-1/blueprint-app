import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getSemesterPlans } from "@/api/semesterPlans";
import { ModulePill } from "@/components/dashboard/ModulePill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SemesterPlan } from "@/types/planner";

const placeholderSemesters = [
  { label: "January 2026", modules: ["IS615", "IS620"], tone: "completed" as const },
  { label: "April 2026", modules: ["IS621", "IS619"], tone: "current" as const },
  { label: "July 2026 (Special Term)", modules: ["IS623"], tone: "planned" as const },
  { label: "August 2026", modules: ["IS630", "IS631"], tone: "planned" as const },
];

const legend = [
  { label: "Completed", tone: "completed" as const },
  { label: "Current Semester", tone: "current" as const },
  { label: "Planned", tone: "planned" as const },
  { label: "Potential Conflict", tone: "conflict" as const },
];

const legendSwatchClassNames = {
  completed: "border-emerald-400/45 bg-emerald-500/30",
  current: "border-blue-300/55 bg-blue-500/35",
  planned: "border-sky-300/45 bg-sky-400/30",
  conflict: "border-red-400/50 bg-red-500/30",
};

export function PlanOverview() {
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
        }
      }
    }

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const semesterColumns = useMemo(() => {
    const plansWithModules = semesterPlans.filter((plan) => plan.plannedModules.length > 0);

    if (plansWithModules.length === 0) {
      return placeholderSemesters;
    }

    return plansWithModules.map((plan) => ({
      label: `${plan.year} ${plan.term}`,
      modules: plan.plannedModules.map((plannedModule) => plannedModule.module.code),
      tone: "planned" as const,
    }));
  }, [semesterPlans]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Your Plan
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">Projected Path</h2>
        </div>
        <Button asChild>
          <Link to="/planner">
            Resume Planning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {legend.map((item) => (
          <div
            className="flex items-center gap-2 rounded-md border border-blue-400/25 bg-blue-950/25 px-3 py-2 text-xs text-blue-100/80"
            key={item.label}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-sm border",
                legendSwatchClassNames[item.tone],
              )}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {isLoading ? (
          <Card className="border-blue-400/35 bg-card/90 lg:col-span-4">
            <CardContent className="flex items-center gap-2 pt-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading plan...
            </CardContent>
          </Card>
        ) : (
          semesterColumns.map((semester) => (
            <Card className="border-blue-400/35 bg-card/90" key={semester.label}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{semester.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {semester.modules.map((code) => (
                    <ModulePill code={code} key={code} tone={semester.tone} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
