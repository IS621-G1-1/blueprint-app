import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePill } from "@/components/dashboard/ModulePill";
import {
  getRequirementStatus,
  type GraduationRequirementCategory,
} from "@/config/graduationRequirements";

interface RequirementCardProps {
  category: GraduationRequirementCategory;
}

export function RequirementCard({ category }: RequirementCardProps) {
  const status = getRequirementStatus(category);
  const isFulfilled = status === "Fulfilled";

  return (
    <Card className="border-blue-400/35 bg-card/90">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <span
            className={
              isFulfilled
                ? "text-sm font-semibold text-emerald-300"
                : "text-sm font-semibold text-red-300"
            }
          >
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-100/75">
          Taken:{" "}
          <span className="font-semibold text-white">
            {category.taken.length} / {category.requiredCount}
          </span>
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Taken
          </p>
          <div className="flex flex-wrap gap-2">
            {category.taken.map((code) => (
              <ModulePill code={code} key={code} tone={isFulfilled ? "completed" : "neutral"} />
            ))}
          </div>
        </div>

        {category.remaining.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Remaining
            </p>
            <p className="text-sm text-blue-100/80">{category.remaining.join(", ")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
