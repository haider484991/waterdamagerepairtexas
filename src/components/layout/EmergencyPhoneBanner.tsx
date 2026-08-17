"use client";

import { Phone } from "lucide-react";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";

/**
 * Site-wide top banner and the single most prominent call path.
 *
 * This used to carry an "Ad" badge next to our own brand name. Users are
 * trained to skip anything labelled that way, so it was suppressing the one
 * element the site earns from. The paid-referral relationship still needs
 * disclosing — it now reads as plain language attached to the offer instead
 * of an ad badge on our own masthead.
 */
export function EmergencyPhoneBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl" />
      </div>

      <CallLink
        placement="top_banner"
        className="relative flex items-center justify-center gap-2 sm:gap-3 px-4 py-2 group cursor-pointer"
        aria-label={`Call our free 24/7 helpline at ${HELPLINE_DISPLAY}`}
      >
        <span className="hidden sm:inline text-blue-100 text-sm font-semibold">
          Water damage emergency?
        </span>

        <span className="hidden sm:block w-px h-4 bg-blue-400/50" aria-hidden="true" />

        <span className="flex items-center gap-2">
          <span className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white/30 motion-safe:animate-ping" aria-hidden="true" />
            <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
            </span>
          </span>
          <span className="text-white font-bold text-base sm:text-lg tracking-wide group-hover:underline decoration-2 underline-offset-2">
            {HELPLINE_DISPLAY}
          </span>
        </span>

        <span className="flex flex-col leading-tight">
          <span className="text-blue-50 text-xs sm:text-sm font-semibold">
            Free 24/7 &mdash; talk to a local pro now
          </span>
          <span className="text-[10px] text-blue-200/90 font-medium">
            Referral line &middot; we may be paid by the pro you&apos;re matched with
          </span>
        </span>
      </CallLink>
    </div>
  );
}
