import Link from "next/link";
import { Phone, MapPin, Search } from "lucide-react";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";
import { getStatesWithBusinesses } from "@/lib/local-data";

/**
 * Someone landed here from a stale SERP result or a removed listing. They still
 * have water on the floor, so the page leads with the helpline rather than an
 * apology, then offers a route back into the directory.
 */
export default function NotFound() {
  const states = getStatesWithBusinesses().slice(0, 12);

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Page not found
      </p>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        That listing has moved or been removed
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        We keep the directory to active water damage restoration companies only, so
        listings do come and go. If you need help right now, the fastest route is the
        helpline — we&apos;ll connect you with an available local pro.
      </p>

      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-900 dark:from-blue-950 dark:to-blue-900/40 p-6 mb-10">
        <p className="font-bold text-lg mb-1">Water damage emergency?</p>
        <p className="text-sm text-muted-foreground mb-4">
          Free 24/7 helpline. Mould can begin within 24&ndash;48 hours, so same-day
          drying matters.
        </p>
        <CallLink
          placement="city_footer_cta"
          className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <Phone className="w-5 h-5" />
          <span className="text-lg">{HELPLINE_DISPLAY}</span>
        </CallLink>
        <p className="text-[11px] text-muted-foreground mt-3">
          Free &bull; 24/7 &bull; No obligation &bull; Referral line, we may be paid by
          the pro you&apos;re matched with
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Find companies by state</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {states.map((s) => (
          <Link
            key={s.slug}
            href={`/states/${s.slug}`}
            className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{s.name}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/states" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <MapPin className="w-4 h-4" /> Browse all states
        </Link>
        <Link href="/search" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <Search className="w-4 h-4" /> Search the directory
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
