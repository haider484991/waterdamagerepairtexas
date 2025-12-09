import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "About Henry Harrison Plano Texas – Your Guide to Plano’s Business Community",
  description:
    "Learn about Henry Harrison Plano Texas, a dedicated directory highlighting top Plano businesses and helping locals discover reliable, community-focused services.",
};

const highlightPoints = [
  "Modern, easy-to-use directory for Plano’s best businesses",
  "Mission: connect residents, visitors, and professionals with trusted local services",
  "Coverage across every major category: home services, restaurants, medical, retail, financial, and more",
  "Continuously updated to reflect new openings, growth, and standout organizations",
  "Built to support a thriving local economy by boosting business visibility",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 blur-3xl rounded-full" />

        <section className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6 max-w-2xl">
              <Badge variant="secondary" className="text-sm">
                About Henry Harrison Plano Texas
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Your guide to the businesses that make Plano thrive.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                HenryHarrisonPlanoTexas.com is a modern, easy-to-use directory that
                showcases the best of Plano’s business community. Our mission is
                simple: connect residents, visitors, and local professionals with
                trusted businesses across every major category in Plano, Texas.
              </p>
            </div>

            <div className="flex-shrink-0">
              <Logo size={96} textSize="text-3xl" priority />
            </div>
          </div>
        </section>
      </div>

      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-8 lg:p-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Why Henry Harrison Plano Texas?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Plano continues to grow as one of the most dynamic economic hubs in
                North Texas. With a thriving mix of small businesses, established
                brands, family-owned shops, and innovative startups, the city offers
                endless options—and we’re here to make them easier to find. Whether
                you’re searching for home services, restaurants, medical providers,
                local boutiques, financial professionals, or community resources, our
                directory puts Plano’s top businesses right at your fingertips.
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Great cities are built on strong local economies. By helping Plano
                  businesses increase their visibility and helping residents discover
                  reliable local services, HenryHarrisonPlanoTexas.com aims to be a
                  trusted guide for anyone looking to engage with the community.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Always Up-to-Date</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform is continually expanding, updated to reflect new openings,
                  growing companies, and standout organizations making an impact in Plano.
                  If you’re a business owner interested in being listed or featured, you’ll
                  find everything you need right here.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {highlightPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-foreground/90 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Discover. Connect. Support Local.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Henry Harrison Plano Texas is here to help you explore, compare, and connect with
                the businesses that keep Plano moving forward. Whether you’re a resident looking
                for a trusted service or a business owner ready to reach more of the community,
                we’re glad you’re here.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="btn-primary px-4 py-2 rounded-lg"
                >
                  Start Exploring Businesses
                </Link>
                <Link
                  href="/add-business"
                  className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  Add or Feature Your Business
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

