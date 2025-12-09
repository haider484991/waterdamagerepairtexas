"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Grid3X3, Heart, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/categories", icon: Grid3X3, label: "Categories" },
  { href: "/dashboard/favorites", icon: Heart, label: "Favorites", auth: true },
  { href: "/dashboard", icon: User, label: "Account", auth: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleItems = navItems.filter(
    (item) => !item.auth || (item.auth && session)
  );

  // Show login instead of account if not authenticated
  const displayItems = session
    ? visibleItems
    : [
        ...navItems.filter((item) => !item.auth),
        { href: "/login", icon: User, label: "Sign In" },
      ];

  return (
    <nav className="mobile-nav safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {displayItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive && "fill-primary/20")}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

