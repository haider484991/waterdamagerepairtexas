import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service | HenryHarrisonPlanoTexas.com",
  description:
    "Terms of Service for HenryHarrisonPlanoTexas.com outlining acceptable use, business listings, and limitations.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Updated: 12-4-25</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to HenryHarrisonPlanoTexas.com (“we,” “us,” or “our”). By accessing or using this website, you
              agree to be bound by the following Terms of Service. If you do not agree, please discontinue use of the
              site. These Terms apply to all visitors, users, and businesses listed on the site.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">1. Purpose of the Website</h2>
                <p className="text-muted-foreground leading-relaxed">
                  HenryHarrisonPlanoTexas.com is an online directory designed to help users discover businesses,
                  services, and community resources located in or serving Plano, Texas. We provide informational
                  listings only and do not guarantee the accuracy, quality, availability, or reliability of any business
                  or service featured on our platform. We are not a service provider, contractor, advisor, or agent for
                  any listed business.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">2. Use of the Website</h2>
                <p className="text-muted-foreground leading-relaxed">By using this site, you agree to:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Use the directory for lawful purposes only</li>
                  <li>Not attempt to disrupt or compromise website functionality</li>
                  <li>Not collect data from the website for unsolicited marketing or commercial purposes</li>
                  <li>Not impersonate any individual or business when submitting information</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or restrict access to any user who violates these Terms.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">3. Business Listings</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Businesses listed on HenryHarrisonPlanoTexas.com are responsible for providing accurate and up-to-date
                  information. We may edit, update, or remove listings at our discretion for reasons including inaccurate
                  information, inactivity, or policy violations. We do not endorse, vet, or verify any business or
                  service listed on the site. Users should perform their own due diligence before engaging with any
                  business.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">4. No Guarantees or Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content on this website is provided on an “as is” and “as available” basis. We make no warranties,
                  express or implied, regarding:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Accuracy of listings</li>
                  <li>Availability of the website</li>
                  <li>Quality or reliability of any business or service</li>
                  <li>Outcomes of interactions with businesses found through the directory</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">Use the website at your own discretion.</p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">5. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the fullest extent permitted by law, we are not liable for any damages arising from:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Use of or inability to use the website</li>
                  <li>Business interactions, disputes, or transactions resulting from directory listings</li>
                  <li>Errors or omissions in listings</li>
                  <li>Third-party links or external websites</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  You agree that HenryHarrisonPlanoTexas.com is not responsible for any losses, claims, or issues related
                  to businesses listed on the site.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">6. Third-Party Links</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The website may include links to third-party websites. These are provided for convenience only. We do
                  not control, endorse, or take responsibility for external content, policies, or practices.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All website content—including text, design, graphics, and layout—is owned by HenryHarrisonPlanoTexas.com
                  or licensed for use. You may not reproduce, distribute, or republish content without prior written
                  permission.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">8. Changes to the Website or Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update the site, modify features, or revise these Terms at any time. Changes become effective
                  upon posting. Continued use of the site indicates acceptance of the updated Terms.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">9. Contacting Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For any questions regarding these Terms of Service, please use the Contact Form located on our Contact
                  page:
                </p>
                <Link
                  href="https://henryharrisonplanotexas.com/contact/"
                  className="text-primary font-semibold hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://henryharrisonplanotexas.com/contact/
                </Link>
                <p className="text-muted-foreground leading-relaxed">All inquiries must be submitted through the form.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

