import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import { CostCalculator } from "@/components/tools/CostCalculator";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQSection } from "@/components/seo/FAQSection";
import { generateBreadcrumbSchema } from "@/lib/seo/schema-markup";
import { getSiteUrl } from "@/lib/site-url";
import { getCitiesWithBusinessesForState, getStatesWithBusinesses } from "@/lib/local-data";

const SITE_URL = getSiteUrl();
const CANONICAL = `${SITE_URL}/water-damage-restoration-cost`;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Water Damage Restoration Cost Calculator (2026) – What You Should Pay",
  description:
    "Work out what water damage restoration should cost before you call anyone. Free calculator using IICRC water categories and classes, plus 2026 national price ranges by room, water type and damage class.",
  keywords: [
    "water damage restoration cost",
    "how much does water damage restoration cost",
    "water damage repair cost",
    "water damage restoration cost calculator",
    "water damage cost per square foot",
    "flood damage repair cost",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Water Damage Restoration Cost Calculator (2026)",
    description:
      "Estimate water damage restoration costs by area, water type and damage class — before a contractor quotes you.",
    url: CANONICAL,
    type: "website",
  },
};

const FAQS = [
  {
    question: "How much does water damage restoration cost?",
    answer:
      "Most homeowners pay between $1,300 and $6,000, with a national average of roughly $3,000–$3,500. Minor clean-water cleanup in a single room runs about $450–$1,500. Moderate damage needing structural drying runs $1,500–$5,000. Major damage involving sewage, standing water or structural repairs runs $5,000–$15,000 or more. The three things that move the number most are how much floor area got wet, whether the water was clean or contaminated, and how long it sat before drying started.",
  },
  {
    question: "How much does water damage restoration cost per square foot?",
    answer:
      "Water mitigation — extraction, drying equipment and daily monitoring — typically runs $3.00 to $4.50 per square foot for a small clean-water job, $4.00 to $7.00 for a fully soaked room, and $7.50 to $13.00 per square foot where hardwood, plaster or crawlspaces need specialty drying. Contaminated water raises those rates by roughly 35% for grey water and 90% for black water, because porous materials get removed rather than dried.",
  },
  {
    question: "Does homeowners insurance cover water damage restoration?",
    answer:
      "Usually yes for sudden, accidental events — a burst pipe, a failed water heater, an overflowing appliance. Usually no for gradual damage such as a slow leak you did not notice, or for groundwater and surface flooding, which needs separate flood insurance. Most policies also require you to mitigate promptly, so delaying drying can reduce what you are paid. Photograph everything before anything is moved or torn out.",
  },
  {
    question: "How long do I have before mould becomes a problem?",
    answer:
      "Mould can begin developing within 24 to 48 hours on wet porous materials such as drywall, carpet underlay and insulation. That is why restoration firms treat water damage as an emergency and why same-day extraction usually costs less overall than waiting — once mould is established you are paying for remediation on top of drying, typically an extra $1,100 to $3,400.",
  },
  {
    question: "What is the difference between water categories 1, 2 and 3?",
    answer:
      "Category 1 is clean water from a supply line, tap or rainwater. Category 2, called grey water, comes from appliances such as washing machines and dishwashers, or a toilet overflow without solids. Category 3, black water, is sewage, ground flooding, or any water that has been standing long enough to grow bacteria — generally more than 48 hours. Categories degrade over time, so clean water left sitting becomes grey and then black, which is why the cost climbs the longer you wait.",
  },
  {
    question: "Should I get more than one quote?",
    answer:
      "Yes — get at least three itemised quotes wherever the situation is not an active emergency. Ask each firm for the drying plan, the daily equipment count, whether they carry IICRC certification, and whether they bill your insurer directly. Be cautious of anyone who quotes a flat price without inspecting, asks for full payment upfront, or pressures you to sign an insurance assignment of benefits on the doorstep.",
  },
];

/** A handful of big metros so the page links into the directory. */
function topCityLinks() {
  const states = getStatesWithBusinesses();
  const out: Array<{ name: string; href: string; count: number }> = [];
  for (const state of states) {
    for (const city of getCitiesWithBusinessesForState(state.code)) {
      if (city.count >= 8) {
        out.push({
          name: `${city.name}, ${state.code}`,
          href: `/states/${state.slug}/${city.slug}`,
          count: city.count,
        });
      }
    }
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 12);
}

export default function CostPage() {
  const cities = topCityLinks();

  return (
    <>
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Water Damage Restoration Cost", url: CANONICAL },
        ])}
        id="cost-breadcrumb"
      />

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Water Damage Restoration Cost</span>
        </nav>

        <header className="max-w-3xl mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 text-balance">
            Water Damage Restoration Cost Calculator
          </h1>
          {/* Direct answer first — this is the paragraph AI Overviews and
              featured snippets quote. */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">
              Most homeowners pay between $1,300 and $6,000 for water damage restoration, with a
              national average of about $3,000&ndash;$3,500.
            </strong>{" "}
            A small clean-water cleanup in one room runs roughly $450&ndash;$1,500. A fully soaked
            room needing structural drying runs $1,500&ndash;$5,000. Sewage, standing water or
            structural repairs push it to $5,000&ndash;$15,000 or more.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The calculator below uses the same framework restoration firms estimate against — the
            IICRC water <em>category</em> (how contaminated) and <em>class</em> (how much material is
            wet). Use it to sanity-check a quote before you accept one.
          </p>
        </header>

        <section className="mb-16" aria-label="Cost calculator">
          <CostCalculator />
        </section>

        {/* ---- Cost tables ---- */}
        <section className="max-w-4xl mb-14">
          <h2 className="text-3xl font-bold mb-3">What drives the price</h2>
          <p className="text-muted-foreground mb-6">
            Two jobs covering the same floor area can differ threefold. These are the variables that
            do it.
          </p>

          <h3 className="text-xl font-bold mb-3">By water category</h3>
          <div className="overflow-x-auto rounded-lg border bg-card mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Where it comes from</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Cost effect</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">Category 1 &mdash; clean</td>
                  <td className="p-3 text-muted-foreground">Burst supply pipe, tap left running, rainwater, failed water heater</td>
                  <td className="p-3 whitespace-nowrap">Baseline</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Category 2 &mdash; grey</td>
                  <td className="p-3 text-muted-foreground">Washing machine or dishwasher discharge, toilet overflow without solids, clean water standing over 24h</td>
                  <td className="p-3 whitespace-nowrap">About +35%</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Category 3 &mdash; black</td>
                  <td className="p-3 text-muted-foreground">Sewage backup, ground or surface flooding, any water standing beyond ~48 hours</td>
                  <td className="p-3 whitespace-nowrap">About +90%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mb-3">By damage class, per square foot</h3>
          <div className="overflow-x-auto rounded-lg border bg-card mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Class</th>
                  <th className="p-3 font-semibold">What it means</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Mitigation rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">Class 1</td>
                  <td className="p-3 text-muted-foreground">Part of one room, little absorption, mostly hard flooring</td>
                  <td className="p-3 whitespace-nowrap tabular-nums">$3.00 &ndash; $4.50</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Class 2</td>
                  <td className="p-3 text-muted-foreground">Whole room, carpet and underlay wet, wicking up walls under 24&Prime;</td>
                  <td className="p-3 whitespace-nowrap tabular-nums">$4.00 &ndash; $7.00</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Class 3</td>
                  <td className="p-3 text-muted-foreground">Water came from overhead; ceilings, walls and insulation saturated</td>
                  <td className="p-3 whitespace-nowrap tabular-nums">$6.00 &ndash; $9.50</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Class 4</td>
                  <td className="p-3 text-muted-foreground">Hardwood, plaster, concrete or crawlspace &mdash; specialty drying</td>
                  <td className="p-3 whitespace-nowrap tabular-nums">$7.50 &ndash; $13.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mb-3">Common add-ons</h3>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Work</th>
                  <th className="p-3 font-semibold">Typical cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-3">Mould remediation</td><td className="p-3 tabular-nums">$1,100 &ndash; $3,400</td></tr>
                <tr className="border-t"><td className="p-3">Hardwood floor drying or replacement</td><td className="p-3 tabular-nums">$2.00 &ndash; $4.50 / sq ft</td></tr>
                <tr className="border-t"><td className="p-3">Ceiling &amp; drywall repair</td><td className="p-3 tabular-nums">$350 &ndash; $1,800</td></tr>
                <tr className="border-t"><td className="p-3">Contents pack-out &amp; cleaning</td><td className="p-3 tabular-nums">$500 &ndash; $2,500</td></tr>
                <tr className="border-t"><td className="p-3">Emergency night / weekend call-out</td><td className="p-3 tabular-nums">+10% &ndash; 20%</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- Insurance ---- */}
        <section className="max-w-4xl mb-14">
          <h2 className="text-3xl font-bold mb-3">What insurance usually pays for</h2>
          <p className="text-muted-foreground mb-6">
            The line insurers draw is <strong className="text-foreground">sudden and accidental</strong>{" "}
            versus <strong className="text-foreground">gradual and preventable</strong>. Most disputes
            come down to which side of it your claim falls on.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border-2 border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
                <h3 className="font-bold">Usually covered</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Burst or frozen supply pipes</li>
                <li>Failed water heater or washing machine hose</li>
                <li>Accidental overflow from a bath or sink</li>
                <li>Storm damage that breaches the roof</li>
                <li>Firefighting water damage</li>
              </ul>
            </div>
            <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TriangleAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="font-bold">Usually not covered</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Slow leaks left unaddressed over time</li>
                <li>Groundwater and surface flooding (needs flood insurance)</li>
                <li>Sewer backup without a specific endorsement</li>
                <li>Damage from deferred maintenance</li>
                <li>Mould, where it followed an uncovered cause</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Before anything is moved or torn out, photograph and video everything, and keep receipts
            for emergency work — most policies require prompt mitigation and will reduce a payout if
            you delayed.
          </p>
        </section>

        {/* ---- CTA ---- */}
        <section className="max-w-4xl mb-14">
          <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/40 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Want a real number for your situation?</h2>
                <p className="text-muted-foreground">
                  A calculator can only work from averages. Call the free 24/7 helpline and we&apos;ll
                  connect you with a vetted local pro who can inspect and quote properly &mdash; usually
                  the same day.
                </p>
              </div>
              <CallLink
                placement="cost_calculator_result"
                className="flex items-center justify-center gap-2 shrink-0 px-7 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-600/20"
              >
                <Phone className="w-5 h-5" />
                <span className="text-lg">{HELPLINE_DISPLAY}</span>
              </CallLink>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              Free &bull; 24/7 &bull; No obligation &bull; Referral line, we may be paid by the pro
              you&apos;re matched with
            </p>
          </div>
        </section>

        {/* ---- Directory links ---- */}
        {cities.length > 0 && (
          <section className="max-w-4xl mb-4">
            <h2 className="text-2xl font-bold mb-4">Compare local restoration companies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cities.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                >
                  <span className="block font-medium text-sm">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.count} companies</span>
                </Link>
              ))}
            </div>
            <Link href="/states" className="inline-block mt-4 text-sm text-primary hover:underline">
              Browse all states &rarr;
            </Link>
          </section>
        )}
      </div>

      <FAQSection
        faqs={FAQS}
        title="Water damage restoration cost — FAQ"
        description="The questions homeowners ask most before authorising work."
      />
    </>
  );
}
