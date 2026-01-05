/**
 * Table of Contents Component
 * 
 * Auto-generated TOC from blog post headings
 */

"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContents({ items, className = "" }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -35% 0%",
        threshold: 0,
      }
    );

    // Observe all heading elements
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={`p-6 bg-card rounded-xl border border-border ${className}`}>
      <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
        Table of Contents
      </h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
            className={`
              transition-colors
              ${activeId === item.id
                ? "text-amber-600 font-medium"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <a
              href={`#${item.id}`}
              className="flex items-center gap-2 py-1 block"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  const offset = 80; // Account for sticky header
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              {item.level > 2 && (
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="line-clamp-1">{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
