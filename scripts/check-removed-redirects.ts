/**
 * Sanity-checks resolveRemovedListingRedirect against the business URLs that
 * Google still ranks but that now 404 (found via the GSC page report).
 * Run: npx tsx scripts/check-removed-redirects.ts
 */
import { resolveRemovedListingRedirect } from "../src/lib/removed-listing-redirect";

const DEAD_SLUGS = [
  "rb-solutions-inc-fresno-california",
  "mold-hazard-cleanup-encino-california",
  "dmandj-landscaping-el-paso-el-paso-texas",
  "ang-chimney-sweep-and-gas-fireplace-of-brooklyn-brooklyn-new-york",
  "pro-gc-and-restoration-cape-coral-florida",
  "cosmic-collision-center-el-paso-texas",
  "nok-construction-orlando-florida",
  "puroclean-anaheim-california",
  "gametime-electronics-fort-lauderdale-florida",
  "steri-clean-biohazard-cleanup-norcal-north-highlands-california",
  "fos-development-corp-long-island-city-new-york",
];

let resolved = 0;
for (const slug of DEAD_SLUGS) {
  const target = resolveRemovedListingRedirect(slug);
  if (target) resolved++;
  console.log(`${target ? "301 ->" : "404   "} ${(target ?? "(no city match)").padEnd(38)} ${slug}`);
}
console.log(`\n${resolved}/${DEAD_SLUGS.length} recovered as redirects`);
