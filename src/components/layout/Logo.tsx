import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  showText?: boolean;
  size?: number;
  textSize?: string;
  className?: string;
  priority?: boolean;
};

export function Logo({
  showText = true,
  size = 40,
  textSize = "text-lg",
  className,
  priority = false,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="relative flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="text-2xl">🏓</span>
      </div>
      {showText && (
        <span className={cn("font-bold leading-tight text-foreground", textSize)}>
          US <span className="text-primary">Pickleball</span>
        </span>
      )}
    </div>
  );
}

