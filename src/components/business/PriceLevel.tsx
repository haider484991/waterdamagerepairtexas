import { cn } from "@/lib/utils";

interface PriceLevelProps {
  level: number;
  maxLevel?: number;
  size?: "sm" | "md";
}

export function PriceLevel({ level, maxLevel = 4, size = "md" }: PriceLevelProps) {
  const dollars = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <span className={cn("font-medium", size === "sm" ? "text-sm" : "text-base")}>
      {dollars.map((dollar) => (
        <span
          key={dollar}
          className={cn(
            dollar <= level ? "text-primary" : "text-muted-foreground/40"
          )}
        >
          $
        </span>
      ))}
    </span>
  );
}

