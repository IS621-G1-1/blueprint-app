import { cn } from "@/lib/utils";

interface ModulePillProps {
  code: string;
  tone?: "completed" | "current" | "planned" | "conflict" | "neutral";
}

const toneClassNames = {
  completed: "border-emerald-400/45 bg-emerald-500/15 text-emerald-200",
  current: "border-blue-300/55 bg-blue-500/20 text-blue-100",
  planned: "border-sky-300/45 bg-sky-400/15 text-sky-100",
  conflict: "border-red-400/50 bg-red-500/15 text-red-200",
  neutral: "border-blue-300/25 bg-blue-950/45 text-blue-100",
};

export function ModulePill({ code, tone = "neutral" }: ModulePillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold",
        toneClassNames[tone],
      )}
    >
      {code}
    </span>
  );
}
