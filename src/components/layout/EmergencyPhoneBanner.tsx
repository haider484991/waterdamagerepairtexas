"use client";

import { Phone } from "lucide-react";

const PHONE_NUMBER = "+18667759098";
const PHONE_DISPLAY = "(866) 775-9098";

export function EmergencyPhoneBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-pulse delay-700" />
      </div>

      <a
        href={`tel:${PHONE_NUMBER}`}
        className="relative flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-2 group cursor-pointer"
      >
        {/* Site brand name */}
        <span className="flex items-center gap-1.5">
          <span className="text-white font-extrabold text-xs sm:text-sm tracking-tight">
            Water Damage Repair<span className="text-blue-300"> USA</span>
          </span>
          <span className="text-[9px] text-blue-300/90 bg-white/15 px-1.5 py-0.5 rounded font-semibold uppercase tracking-widest">
            Ad
          </span>
        </span>

        <span className="w-px h-4 bg-blue-400/50" />

        {/* Phone section */}
        <span className="flex items-center gap-2">
          <span className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white/30 animate-ping" />
            <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </span>
          </span>
          <span className="text-white font-bold text-base sm:text-lg tracking-wide group-hover:underline decoration-2 underline-offset-2">
            {PHONE_DISPLAY}
          </span>
        </span>

        <span className="hidden sm:block w-px h-4 bg-blue-400/50" />

        <span className="hidden md:inline text-blue-100 text-sm font-medium">
          Get Matched with Local Pros
        </span>
        <span className="inline md:hidden text-blue-100 text-xs font-medium">
          Get Help
        </span>
      </a>
    </div>
  );
}
