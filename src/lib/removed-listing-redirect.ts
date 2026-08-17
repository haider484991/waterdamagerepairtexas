import {
  getStatesWithBusinesses,
  getCitiesWithBusinessesForState,
} from "@/lib/local-data";

/**
 * Recover ranking surface from listings that no longer exist.
 *
 * Listings get dropped for good reasons — off-vertical businesses filtered at
 * the data layer, records lost in a scrape merge — but Google keeps ranking the
 * URL for a while afterwards. Eleven of our top-250 pages by impression were
 * returning 404, including one sitting at position 9.6, and a 404 throws that
 * away instead of passing it somewhere useful.
 *
 * Business slugs are built as `<name>-<city>-<state>`, so the city is
 * recoverable from the URL itself. That makes this self-maintaining: any future
 * removal redirects to the right city page without anyone curating a list.
 */
export function resolveRemovedListingRedirect(slug: string): string | null {
  const normalized = slug.toLowerCase();

  for (const state of getStatesWithBusinesses()) {
    const suffix = `-${state.slug}`;
    if (!normalized.endsWith(suffix)) continue;

    const head = normalized.slice(0, -suffix.length);
    let best: { slug: string } | null = null;

    for (const city of getCitiesWithBusinessesForState(state.code)) {
      // Longest match wins so "el-paso" beats "paso" on
      // dmandj-landscaping-el-paso-el-paso-texas.
      const isMatch = head === city.slug || head.endsWith(`-${city.slug}`);
      if (isMatch && (!best || city.slug.length > best.slug.length)) {
        best = city;
      }
    }

    if (best) return `/states/${state.slug}/${best.slug}`;

    // The city has no page of its own (too few listings to be worth indexing),
    // so fall back to the state page — still topically relevant, and better
    // than discarding the ranking entirely.
    return `/states/${state.slug}`;
  }

  return null;
}
