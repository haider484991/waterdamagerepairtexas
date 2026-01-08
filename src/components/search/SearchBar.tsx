"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  size?: "default" | "large";
  showSuggestions?: boolean;
  className?: string;
  defaultValue?: string;
}

const popularSearches = [
  "Water damage restoration",
  "Emergency flood cleanup",
  "Mold remediation",
  "24/7 water damage",
  "Insurance claim help",
];

const recentSearches = [
  "Water damage near me",
  "Flood repair services",
];

export function SearchBar({
  placeholder = "Search water damage restoration, mold remediation, flood cleanup...",
  size = "default",
  showSuggestions = true,
  className,
  defaultValue = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    setIsFocused(false);
  };

  const showDropdown = isFocused && showSuggestions;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
              size === "large" ? "w-6 h-6" : "w-5 h-5"
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className={cn(
              "w-full bg-white border border-border rounded-xl text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
              "transition-all duration-200 shadow-sm",
              size === "large"
                ? "pl-14 pr-32 py-5 text-lg"
                : "pl-12 pr-24 py-3.5 text-base"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full",
                "text-muted-foreground hover:text-foreground hover:bg-secondary",
                "transition-colors",
                size === "large" ? "right-28" : "right-20"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            type="submit"
            size={size === "large" ? "lg" : "default"}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              size === "large" ? "px-6" : "px-4"
            )}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-card border border-border/50 shadow-xl z-50"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSuggestionClick(search)}
                      className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSuggestionClick(search)}
                    className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Location hint */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Searching across <strong className="text-foreground">Texas</strong></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

