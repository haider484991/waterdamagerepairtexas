import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy | WaterDamageRepairTexas.net",
  description:
    "Privacy policy for WaterDamageRepairTexas.net detailing what information we collect, how we use it, and your choices.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Effective Date: December 11, 2025</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              WaterDamageRepairTexas.net (the "Site," "we," "us," or "our") is owned and operated by Shield Web Services, LLC, a limited liability company based in the United States.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit WaterDamageRepairTexas.net or use any of our services (collectively, the "Services").
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using the Site, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect the following types of information:
                </p>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">a. Information You Provide Voluntarily</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Name, email address, phone number, or other contact details when you:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground ml-4">
                    <li>Submit a business listing or update request</li>
                    <li>Contact us via email or contact forms</li>
                    <li>Sign up for newsletters or updates (if available)</li>
                    <li>Create an account (if account functionality is implemented)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Any additional information you choose to provide (e.g., photos, business descriptions, reviews, or comments)
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">b. Automatically Collected Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Usage Data:</strong> IP address, browser type, device information, operating system, referring URLs, pages viewed, time spent on pages, and clickstream data.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Cookies and Similar Technologies:</strong> We use cookies, local storage, and similar tracking technologies to improve user experience, analyze traffic, and remember preferences.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You can control cookies through your browser settings. Disabling cookies may limit some functionality.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">c. Third-Party Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you log in or interact via third-party services (e.g., Google, Facebook, or Apple login in the future), we may receive limited profile information from those services with your consent.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>To operate, maintain, and improve the Site and Services</li>
                  <li>To display and organize water damage restoration business listings and related content</li>
                  <li>To respond to your inquiries, comments, or business submission requests</li>
                  <li>To send administrative or account-related communications</li>
                  <li>To send marketing communications (e.g., newsletters), only if you opt in (you can unsubscribe at any time)</li>
                  <li>To detect, prevent, and address technical issues, fraud, or abuse</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">3. Sharing Your Information</h2>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  We do not sell your personal information.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">Service Providers:</span> With trusted third parties who assist us in operating the Site (e.g., hosting providers, analytics services, email delivery services) under strict confidentiality agreements.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Legal Requirements:</span> If required by law, regulation, legal process, or governmental request.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Publicly Displayed Information:</span> Business listings, photos, reviews, or comments you submit may be publicly visible on the Site.
                  </li>
                </ul>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement reasonable technical and organizational measures to protect your data from unauthorized access, loss, or misuse. However, no method of transmission over the internet or electronic storage is 100% secure.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">5. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain personal information only as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Business listings and user-submitted content may remain on the Site indefinitely unless you request removal.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">6. Your Rights and Choices</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Access, correct, or delete your personal information</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request restriction of processing or data portability</li>
                  <li>Object to certain data processing activities</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  To exercise these rights, please contact us at{" "}
                  <a
                    href="mailto:shieldwebservices@gmail.com"
                    className="text-primary hover:underline"
                  >
                    shieldwebservices@gmail.com
                  </a>
                  .
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We will respond to verifiable requests within a reasonable timeframe, typically within 30 days.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">7. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Site is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">8. Third-Party Links</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Site may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">9. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised "Effective Date." Continued use of the Site after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact:
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
                  Thank you for using WaterDamageRepairTexas.net — connecting property owners with trusted water damage restoration professionals.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
