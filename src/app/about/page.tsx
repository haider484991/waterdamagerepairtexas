import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "About Water Damage Repair Texas - Your Guide to Restoration Services",
  description:
    "Learn about Water Damage Repair Texas, a dedicated directory connecting Texas property owners with trusted water damage restoration, flood cleanup, and mold remediation professionals.",
};

const highlightPoints = [
  "Modern, easy-to-use directory for Texas water damage restoration services",
  "Mission: connect property owners with trusted, certified restoration professionals",
  "Coverage across all Texas regions: DFW, Houston, Austin, San Antonio, and more",
  "Continuously updated with verified service providers and customer reviews",
  "Built to help Texans recover quickly from water damage emergencies",
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
                About Water Damage Repair Texas
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Your guide to water damage restoration services across Texas.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Water Damage Repair Texas is a comprehensive directory that
                connects property owners with the best water damage restoration
                professionals across the Lone Star State. Our mission is simple:
                help Texans quickly find trusted, certified restoration services
                when water damage strikes.
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
                Why Water Damage Repair Texas?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Texas faces unique water damage challenges—from Gulf Coast hurricanes and
                tropical storms to flash floods, burst pipes, and appliance failures. When
                disaster strikes, you need fast access to reliable restoration professionals.
                Whether you're dealing with emergency flood cleanup, mold remediation, water
                extraction, or storm damage repair, our directory puts trusted service
                providers right at your fingertips.
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Quick response is critical in water damage situations. By helping
                  restoration companies increase their visibility and helping property
                  owners find reliable services fast, Water Damage Repair Texas aims
                  to be the trusted resource for anyone dealing with water damage emergencies.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Always Up-to-Date</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform is continually expanding, updated to reflect new service
                  providers, verified certifications, and customer reviews. If you're a
                  restoration business owner interested in being listed or featured,
                  you'll find everything you need right here.
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
              <h3 className="text-xl font-semibold text-foreground">Find Help Fast. Recover Quickly.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Water Damage Repair Texas is here to help you find, compare, and connect with
                the restoration professionals who can get your property back to normal.
                Whether you're a homeowner facing an emergency or a business owner ready
                to reach more customers, we're glad you're here.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="btn-primary px-4 py-2 rounded-lg"
                >
                  Find Restoration Services
                </Link>
                <Link
                  href="/add-business"
                  className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  List Your Business
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
