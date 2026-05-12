import { RequirementCard } from "@/components/dashboard/RequirementCard";
import { graduationRequirements } from "@/config/graduationRequirements";

export function RequirementsCheck() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {graduationRequirements.programme} {graduationRequirements.specialisation}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">
          MITB Requirements Check
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {graduationRequirements.categories.map((category) => (
          <RequirementCard category={category} key={category.id} />
        ))}
      </div>
    </section>
  );
}
