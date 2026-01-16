import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service | WaterDamageRepair.io",
  description:
    "Terms of Service for WaterDamageRepair.io outlining acceptable use, user content, and limitations.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Effective Date: December 11, 2025</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground leading-relaxed">
              WaterDamageRepair.io (the "Site," "we," "us," or "our") is owned and operated by Shield Web Services, LLC, a Washington State-based limited liability company.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using WaterDamageRepair.io and any related services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Services.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">1. Use of the Services</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">1.1</strong> You must be at least 13 years old to use the Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">1.2</strong> You are responsible for maintaining the confidentiality of any account credentials (if accounts are implemented) and for all activities that occur under your account.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">1.3</strong> You agree to use the Services only for lawful purposes and in compliance with these Terms and all applicable laws.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">2. User-Submitted Content</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">2.1</strong> You may submit water damage restoration business listings, photos, reviews, comments, ratings, corrections, or other content ("User Content").
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">2.2</strong> By submitting User Content, you grant Shield Web Services, LLC a worldwide, perpetual, irrevocable, royalty-free, transferable license (with the right to sublicense) to use, copy, modify, distribute, display, and create derivative works of that content for any purpose, including commercial use.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">2.3</strong> You represent and warrant that:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground ml-4">
                    <li>You own or have the necessary rights to submit the User Content</li>
                    <li>The User Content does not violate any third-party rights (including copyright, trademark, privacy, or publicity rights)</li>
                    <li>The User Content is accurate to the best of your knowledge</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">2.4</strong> We may (but are not obligated to) review, edit, or remove any User Content at our sole discretion.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">3. Prohibited Conduct</h2>
                <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Submit false, misleading, defamatory, obscene, harassing, or illegal content</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with or disrupt the Services or servers</li>
                  <li>Attempt to gain unauthorized access to the Services or other users' accounts</li>
                  <li>Use automated scripts, bots, scrapers, or crawlers on the Site without prior written permission</li>
                  <li>Engage in commercial solicitation or spam</li>
                </ul>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">4. Intellectual Property</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">4.1</strong> The Site, its design, software, databases, trademarks, and all content created by us (excluding User Content) are owned by Shield Web Services, LLC or its licensors and protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">4.2</strong> You may not copy, modify, distribute, sell, or create derivative works of our content without express written permission.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">5. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">6. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIELD WEB SERVICES, LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICES.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED ONE HUNDRED U.S. DOLLARS ($100 USD).
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">7. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to defend, indemnify, and hold harmless Shield Web Services, LLC and its affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of your use of the Services, your User Content, or your violation of these Terms.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">8. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate your access to the Services at any time, with or without cause or notice. Upon termination, your right to use the Services ceases immediately.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">9. Governing Law & Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of the State of Washington, without regard to conflict of law principles. Any dispute arising from these Terms or the Services shall be resolved exclusively in the state or federal courts located in King County, Washington.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">10. Changes to These Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms at any time. The updated version will be posted on this page with a new "Effective Date." Your continued use of the Services after changes constitutes acceptance of the revised Terms.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about these Terms, please contact:
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg space-y-1">
                  <p className="text-foreground font-semibold">Shield Web Services, LLC</p>
                  <p className="text-muted-foreground">
                    Email:{" "}
                    <a
                      href="mailto:shieldwebservices@gmail.com"
                      className="text-primary hover:underline"
                    >
                      shieldwebservices@gmail.com
                    </a>
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed italic">
                  Thank you for helping build the most complete water damage restoration directory!
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
