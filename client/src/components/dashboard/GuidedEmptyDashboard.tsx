import { ArrowRight, BookOpen, Compass, ListPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const nextSteps = [
  {
    title: "Create your first semester",
    description: "Pick a year and term so BlueprInT has a place to save your modules.",
    icon: ListPlus,
  },
  {
    title: "Search for modules",
    description: "Find modules by code, name, or topic and add the ones you are considering.",
    icon: BookOpen,
  },
  {
    title: "Explore suggested starting points",
    description: "Begin with common MITB module keywords, then tune the plan around your goals.",
    icon: Compass,
  },
];

export function GuidedEmptyDashboard() {
  return (
    <section className="overflow-hidden rounded-md border border-blue-400/30 bg-blue-950/25">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Start here
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-normal text-white">
            Your dashboard is ready. Add your first module to build your graduation path.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">
            Once modules are added to a semester plan, this guide will be replaced by your
            requirements progress and projected path.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/planner">
                Start planning
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/planner?query=IS">Search modules</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/planner?query=analytics">Explore recommendations</Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-blue-400/25 bg-background/30 p-6 lg:border-l lg:border-t-0">
          <div className="space-y-3">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  className="flex gap-3 rounded-md border border-blue-400/25 bg-blue-950/30 p-4"
                  key={step.title}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/50">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-blue-100/65">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
