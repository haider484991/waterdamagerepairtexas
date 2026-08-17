"use client";

import { Phone } from "lucide-react";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";

export function FloatingCallButton() {
  return (
    <CallLink
      placement="floating_mobile"
      className="fixed bottom-20 right-4 z-50 md:hidden flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white pl-3 pr-4 py-3 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label={`Call our free 24/7 helpline at ${HELPLINE_DISPLAY}`}
    >
      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white/20 motion-safe:animate-ping" aria-hidden="true" />
        <Phone className="relative w-4 h-4 text-white" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-bold text-sm tracking-wide">{HELPLINE_DISPLAY}</span>
        <span className="text-[9px] text-blue-200 font-semibold uppercase tracking-wider">
          Free 24/7 helpline
        </span>
      </span>
    </CallLink>
  );
}
