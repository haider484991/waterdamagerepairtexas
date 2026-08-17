import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, ShieldCheck, TriangleAlert, Camera } from "lucide-react";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQSection } from "@/components/seo/FAQSection";
import { generateBreadcrumbSchema } from "@/lib/seo/schema-markup";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const CANONICAL = `${SITE_URL}/does-homeowners-insurance-cover-water-damage`;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Does Homeowners Insurance Cover Water Damage? (2026 Guide)",
  description:
    "What homeowners insurance pays for after water damage and what it refuses. The sudden-and-accidental test, flood and sewer exclusions, mould limits, and how to document a claim so it isn't reduced.",
  keywords: [
    "does homeowners insurance cover water damage",
    "does insurance cover water damage",
    "water damage insurance claim",
    "is water damage covered by insurance",
    "homeowners insurance water damage exclusions",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Does Homeowners Insurance Cover Water Damage?",
    description:
      "The sudden-and-accidental test, what's excluded, and how to document a claim properly.",
    url: CANONICAL,
    type: "website",
  },
};

const SCENARIOS: Array<{ scenario: string; verdict: "yes" | "no" | "depends"; note: string }> = [
  { scenario: "Pipe bursts inside a wall", verdict: "yes", note: "Sudden and accidental. The damage is covered; the pipe repair itself often is not." },
  { scenario: "Water heater fails and floods the garage", verdict: "yes", note: "Covered as sudden failure. Replacing the heater is usually on you." },
  { scenario: "Washing machine hose splits", verdict: "yes", note: "Covered. Keep the failed hose — insurers sometimes ask for it." },
  { scenario: "Bath or sink overflows", verdict: "yes", note: "Covered as accidental discharge, even when someone left the tap running." },
  { scenario: "Roof torn open by a storm, rain gets in", verdict: "yes", note: "Covered when wind or hail created the opening first." },
  { scenario: "Firefighters flood the house putting out a fire", verdict: "yes", note: "Covered under the fire claim." },
  { scenario: "Slow leak under the sink you didn't notice for months", verdict: "no", note: "Treated as gradual damage and deferred maintenance." },
  { scenario: "River, storm surge or heavy rain floods the ground floor", verdict: "no", note: "Needs separate flood insurance — NFIP or a private policy." },
  { scenario: "Groundwater seeps through the basement wall", verdict: "no", note: "Seepage is excluded on standard policies." },
  { scenario: "Sewer or drain backs up into the house", verdict: "depends", note: "Only with a sewer/water backup endorsement, usually capped at $5,000–$25,000." },
  { scenario: "Sump pump fails during a storm", verdict: "depends", note: "Needs the same backup endorsement or a specific sump pump rider." },
  { scenario: "Mould found after a covered leak", verdict: "depends", note: "Often covered but capped — $5,000–$10,000 is typical unless you bought more." },
  { scenario: "Mould from long-term humidity or an uncovered leak", verdict: "no", note: "Excluded, because the underlying cause was not covered." },
  { scenario: "Frozen pipe bursts in a house you left unheated", verdict: "no", note: "Most policies exclude this if you failed to maintain heat or shut off the supply." },
];

const VERDICT_STYLES = {
  yes: { label: "Usually covered", cls: "text-green-700 dark:text-green-400" },
  no: { label: "Usually not", cls: "text-red-700 dark:text-red-400" },
  depends: { label: "Only with add-on", cls: "text-amber-700 dark:text-amber-400" },
} as const;

const FAQS = [
  {
    question: "Does homeowners insurance cover water damage?",
    answer:
      "Standard homeowners insurance covers water damage that is sudden and accidental — a burst pipe, a failed water heater, an overflowing appliance, or rain entering after a storm opens the roof. It does not cover gradual damage such as a slow leak left unaddressed, and it does not cover flooding from groundwater or surface water, which requires separate flood insurance. Sewer backup and sump pump failure are only covered if you added an endorsement for them.",
  },
  {
    question: "What is the sudden and accidental test?",
    answer:
      "It is the standard insurers apply to decide whether water damage is covered. If the escape of water happened abruptly and was not something you could reasonably have prevented, it is generally covered. If it happened slowly, repeatedly, or because maintenance was deferred, it is generally excluded. This is why the same pipe can produce a covered claim when it bursts and an uncovered one when it drips for six months.",
  },
  {
    question: "Does insurance cover the pipe itself or just the damage?",
    answer:
      "Usually just the damage. A standard policy pays to dry the structure, replace ruined drywall, flooring and contents, but not to repair or replace the component that failed. Some policies include limited 'tear-out' coverage to reach the pipe, which pays for opening and reinstating the wall even though the plumbing repair is yours.",
  },
  {
    question: "Is mould covered after water damage?",
    answer:
      "Typically yes when the mould resulted directly from a covered event and you mitigated promptly, but almost always with a sub-limit — $5,000 to $10,000 is common, well below the cost of a large remediation. Mould caused by humidity, condensation or an uncovered leak is excluded. Since mould can start within 24 to 48 hours, delaying drying is one of the fastest ways to turn a covered claim into a disputed one.",
  },
  {
    question: "Will making a water damage claim raise my premium?",
    answer:
      "It can, and water claims are among the ones insurers weigh most heavily because they often recur. For damage close to your deductible it is frequently cheaper to pay out of pocket than to file. Get an itemised estimate first, compare it against your deductible, and decide before you open a claim — an inquiry alone can appear on your claims history.",
  },
  {
    question: "How quickly do I need to act to protect my claim?",
    answer:
      "Immediately. Nearly every policy places a duty on you to mitigate further damage, so stop the source, start extraction and document everything the same day. Photograph and video every affected room before anything is moved or torn out, keep all receipts including for fans or a hotel, and notify your insurer promptly. Delay is the most common reason a payout gets reduced.",
  },
];

export default function InsurancePage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Does Homeowners Insurance Cover Water Damage?", url: CANONICAL },
        ])}
        id="insurance-breadcrumb"
      />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Insurance &amp; water damage</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 text-balance">
            Does homeowners insurance cover water damage?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">
              Usually yes if the water escaped suddenly and accidentally, and usually no if it built
              up gradually or came from outside the building.
            </strong>{" "}
            A burst pipe is covered. A slow leak under the sink is not. A flooded river is not —
            that needs separate flood insurance. Sewer backup is only covered if you bought the
            endorsement.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Below is the scenario-by-scenario breakdown, the exclusions that catch people out, and
            what to do in the first hour so your claim is not reduced later.
          </p>
        </header>

        <section className="mb-14">
          <h2 className="text-3xl font-bold mb-3">Covered or not: 14 real scenarios</h2>
          <p className="text-muted-foreground mb-6">
            Coverage varies by policy and state, so treat this as the general rule and check your own
            declarations page.
          </p>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 font-semibold">What happened</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Covered?</th>
                  <th className="p-3 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => (
                  <tr key={s.scenario} className="border-t">
                    <td className="p-3 font-medium">{s.scenario}</td>
                    <td className={`p-3 whitespace-nowrap font-semibold ${VERDICT_STYLES[s.verdict].cls}`}>
                      {VERDICT_STYLES[s.verdict].label}
                    </td>
                    <td className="p-3 text-muted-foreground">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-3xl font-bold mb-6">The three exclusions that catch people out</h2>
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                Flooding is never in a standard policy
              </h3>
              <p className="text-sm text-muted-foreground">
                Water that arrives across the ground — river, storm surge, heavy rainfall pooling
                outside — is excluded from every standard homeowners policy in the US. It needs an
                NFIP policy or a private flood policy, and those carry a 30-day waiting period, so
                buying one when a storm is forecast does not work.
              </p>
            </div>
            <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                Sewer backup needs an endorsement
              </h3>
              <p className="text-sm text-muted-foreground">
                Drain and sewer backup, and sump pump failure, are excluded by default. The
                endorsement is usually inexpensive but capped — commonly $5,000 to $25,000, which a
                Category 3 basement job can exceed on its own.
              </p>
            </div>
            <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                &ldquo;Gradual&rdquo; is decided after the fact
              </h3>
              <p className="text-sm text-muted-foreground">
                Adjusters look for staining, rot and mould growth to judge how long water was
                present. A leak you genuinely did not know about can still be denied as gradual if
                the evidence says it ran for months. Documenting the moment you discovered it, and
                acting the same day, is what separates the two.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-3xl font-bold mb-6">What to do in the first hour</h2>
          <ol className="space-y-4">
            {[
              ["Stop the source", "Shut off the main supply or the isolation valve. If it is not a supply issue, cut power to affected circuits before entering standing water."],
              ["Photograph everything first", "Video every room and close-ups of damaged materials before anything is moved. This is the single most valuable thing you can do for the claim."],
              ["Call your insurer and open the claim", "Get a claim number the same day. Ask specifically whether emergency mitigation is pre-authorised."],
              ["Start extraction — do not wait for the adjuster", "Policies require you to prevent further damage. Waiting is what reduces payouts, and mould can start within 24–48 hours."],
              ["Keep every receipt", "Fans, dehumidifiers, a hotel night, replacement essentials. Additional living expenses are usually reimbursable when the home is uninhabitable."],
              ["Get an itemised estimate before authorising work", "Compare it against your deductible. For smaller jobs it is often cheaper not to claim at all."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex gap-3 mt-6 p-4 rounded-lg bg-muted/50 border">
            <Camera className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              If you only remember one thing: photograph and video everything before a single item is
              moved. Restoration crews have to tear out wet material to do their job, and once it is
              gone you cannot prove what it looked like.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/40 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Need someone who bills your insurer directly?</h2>
                <p className="text-muted-foreground">
                  Many restoration firms handle the claim paperwork and bill your insurer directly, so
                  you only pay the deductible. Call the free 24/7 helpline and we&apos;ll connect you
                  with a vetted local pro who does.
                </p>
              </div>
              <CallLink
                placement="insurance_guide"
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

        <section className="mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/water-damage-restoration-cost" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <ShieldCheck className="w-4 h-4" /> Work out what restoration should cost
            </Link>
            <Link href="/states" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              Find restoration companies near you
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
            This guide is general information, not insurance advice. Coverage differs by carrier,
            policy form and state — read your own declarations page and endorsements, and speak to
            your agent about anything specific to your claim.
          </p>
        </section>
      </div>

      <FAQSection
        faqs={FAQS}
        title="Water damage insurance — FAQ"
        description="The questions homeowners ask before opening a claim."
      />
    </>
  );
}
