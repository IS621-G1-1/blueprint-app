import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  className?: string;
}

export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span className={cn("font-bold tracking-normal text-white", className)}>
      Bluepr<span className="text-accent">InT</span>
    </span>
  );
}
