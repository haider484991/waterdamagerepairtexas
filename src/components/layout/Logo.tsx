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
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Image
          src={showText ? "/logo-icon.svg" : "/logo-icon.svg"}
          alt="Water Damage Repair USA - Emergency Restoration Services"
          width={size}
          height={size}
          priority={priority}
          className="object-contain"
        />
      </div>
      {showText && (
        <span className={cn("font-bold leading-tight text-foreground", textSize)}>
          <span className="text-primary">Water Damage</span> Repair
          <span className="text-primary"> USA</span>
        </span>
      )}
    </div>
  );
}
