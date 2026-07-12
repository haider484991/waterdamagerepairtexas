/**
 * Merge scraped Google Maps places (NDJSON from the Playwright scraper)
 * into src/data/businesses.json using the site's exact schema.
 *
 * - Dedupes against existing records by googleId (hex pair) and phone.
 * - Applies the same off-vertical filter as src/lib/local-data.ts.
 * - Groups each business under its target metro city/state so the
 *   corresponding /states/[state]/[city] page fills up.
 *
 * Usage: node scripts/merge-scraped.js <scraped.ndjson>
 */
const fs = require("fs");
const path = require("path");

const NDJSON = process.argv[2];
if (!NDJSON || !fs.existsSync(NDJSON)) {
  console.error("Usage: node scripts/merge-scraped.js <scraped.ndjson>");
  process.exit(1);
}
const FILE = path.join(__dirname, "..", "src", "data", "businesses.json");

const DENY = /\bauto\b|dent removal|auto body|phone repair|janitorial|house cleaning|crime victim|body shop|landscap|lawn/i;
const ALLOW = /restoration|water damage|mold|flood|fire damage|waterproof|remediation|environmental|sewage|biohazard|asbestos|home inspector|roofing|storm/i;

const existing = JSON.parse(fs.readFileSync(FILE, "utf8"));
const gids = new Set(existing.map((b) => b.googleId).filter(Boolean));
const phones = new Set(existing.map((b) => (b.phone || "").replace(/\D/g, "")).filter(Boolean));
const slugs = new Set(existing.map((b) => b.slug));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmtPhone = (p) => {
  const d = (p || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `+1 ${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `+1 ${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p || null;
};
const cleanText = (t) => (t || "").replace(/\s*…\s*$/, "").replace(/\s+/g, " ").trim() || null;
const mapReviews = (list) =>
  (list || [])
    .filter((r) => r && (r.text || r.authorName))
    .map((r) => ({
      reviewId: null,
      authorName: r.authorName || null,
      authorId: null,
      authorImage: r.authorImage || null,
      authorLink: null,
      text: cleanText(r.text),
      imageUrls: [],
      ownerAnswer: null,
      ownerAnswerTimestamp: null,
      reviewLink: null,
      rating: typeof r.rating === "number" ? r.rating : null,
      timestamp: r.relTime || null,
      datetimeUtc: null,
      likes: 0,
    }));
const catId = (c) => {
  const s = (c || "").toLowerCase();
  if (/mold/.test(s)) return "cat-mold-remediation";
  if (/fire|storm/.test(s)) return "cat-storm-damage";
  if (/flood/.test(s)) return "cat-flood-cleanup";
  return "cat-water-damage-restoration";
};

const lines = fs.readFileSync(NDJSON, "utf8").split("\n").filter(Boolean);
const seen = new Set();
let added = 0, dupes = 0, filtered = 0, noPhone = 0;
const now = new Date().toISOString();
const stamp = Date.now();
let seq = 0;

for (const line of lines) {
  let r;
  try { r = JSON.parse(line); } catch { continue; }
  if (!r.name || !r._metro) continue;
  if (seen.has(r._gid)) continue;
  seen.add(r._gid);

  const hay = `${r.category || ""} ${r.name}`;
  if (DENY.test(r.name) || DENY.test(r.category || "") || !ALLOW.test(hay)) { filtered++; continue; }
  if (!r.phone) { noPhone++; continue; }

  const phoneDigits = r.phone.replace(/\D/g, "");
  if (gids.has(r._gid) || phones.has(phoneDigits)) { dupes++; continue; }

  const [city, state] = r._metro.split(",").map((s) => s.trim());
  let slug = slugify(`${r.name}-${city}-${state}`);
  let n = 2;
  while (slugs.has(slug)) slug = slugify(`${r.name}-${city}-${state}`) + `-${n++}`;
  slugs.add(slug);
  gids.add(r._gid);
  phones.add(phoneDigits);

  const zipM = (r.address || "").match(/\b(\d{5})(?:-\d{4})?\b(?!.*\d{5})/);
  const llM = (r._url || "").match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);

  existing.push({
    id: `biz-${stamp}-${String(++seq).padStart(5, "0")}`,
    googlePlaceId: null,
    googleId: r._gid || null,
    cid: null,
    name: r.name,
    slug,
    description: null,
    address: r.address || `${city}, ${state}`,
    street: r.address ? r.address.split(",")[0].trim() : null,
    city,
    state,
    zip: zipM ? zipM[1] : null,
    country: "United States",
    countryCode: "US",
    neighborhood: null,
    areaService: false,
    phone: fmtPhone(r.phone),
    website: r.website || null,
    email: null,
    lat: llM ? llM[1] : null,
    lng: llM ? llM[2] : null,
    plusCode: r.plusCode || null,
    googleMapsUrl: r._url || null,
    type: r.category || "Water damage restoration service",
    subtypes: r.subtypes && r.subtypes.length ? r.subtypes : (r.category ? [r.category] : []),
    googleCategory: r.category || null,
    categoryId: catId(r.category),
    about: r.about || null,
    ratingAvg: r.rating ? String(r.rating) : "0",
    reviewCount: r.reviews || 0,
    reviewsPerScore: r.perScore || null,
    reviewsLink: null,
    reviewsTags: [],
    reviewsData: mapReviews(r.reviews_list),
    photos: r.photos && r.photos.length ? r.photos : null,
    photosCount: r.photos ? r.photos.length : 0,
    streetView: null,
    logo: r.logo || null,
    businessStatus: r.businessStatus || "OPERATIONAL",
    isVerified: false,
    isFeatured: false,
    ownerId: null,
    ownerTitle: null,
    ownerLink: null,
    hours: r.hours || null,
    hoursRaw: null,
    hoursOldFormat: null,
    priceLevel: null,
    priceRange: null,
    popularTimes: [],
    reservationLink: null,
    menuLink: null,
    orderLinks: [],
    locatedIn: null,
    locatedGoogleId: null,
    facebook: null,
    instagram: null,
    twitter: null,
    linkedin: null,
    createdAt: now,
    updatedAt: now,
  });
  added++;
}

fs.writeFileSync(FILE, JSON.stringify(existing, null, 2));
console.log(`scraped lines: ${lines.length} | added: ${added} | dupes: ${dupes} | filtered: ${filtered} | no-phone: ${noPhone}`);
console.log(`businesses.json now has ${existing.length} records`);

// coverage report for the target metros
const counts = {};
existing.forEach((b) => { const k = `${b.city}, ${b.state}`; counts[k] = (counts[k] || 0) + 1; });
const metros = [...new Set(lines.map((l) => { try { return JSON.parse(l)._metro; } catch { return null; } }).filter(Boolean))];
const still = metros.filter((m) => (counts[m] || 0) < 3);
console.log(`target metros: ${metros.length} | now >=3 businesses: ${metros.length - still.length} | still thin: ${still.length}`);
if (still.length) console.log("thin:", still.join("; "));
