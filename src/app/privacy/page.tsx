import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy | HenryHarrisonPlanoTexas.com",
  description:
    "Privacy policy for HenryHarrisonPlanoTexas.com detailing what information we collect, how we use it, and your choices.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Updated: 12-4-25</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              HenryHarrisonPlanoTexas.com (“we,” “us,” or “our”) is committed to protecting the
              privacy of visitors who use our website and directory. This Privacy Policy explains
              what information we collect, how we use it, and the choices available to you. By
              accessing or using our website, you agree to the practices described below.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may collect the following types of information:
                </p>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">a. Information You Provide Voluntarily</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you submit information through forms on our website—including the Contact form—we may collect
                    details such as your name, business name, and any message you choose to provide.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">b. Automatically Collected Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you visit our website, standard web analytics may collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>IP address</li>
                    <li>Browser type</li>
                    <li>Device information</li>
                    <li>Pages visited</li>
                    <li>Referral sources</li>
                    <li>Date and time of access</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    This information helps us maintain and improve the performance of our directory.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">c. Cookies and Tracking Technologies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may use cookies or similar technologies to enhance your browsing experience, track usage patterns,
                    and maintain website functionality.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may use collected information to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Respond to inquiries submitted through our Contact form</li>
                  <li>Improve our website and directory features</li>
                  <li>Monitor website performance and security</li>
                  <li>Maintain accurate business listings and user experience</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell or rent your information to third parties.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">3. Sharing of Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may share information only in the following limited situations:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">Service Providers:</span> Trusted third parties who
                    assist in operating our website or analytics, under confidentiality agreements.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Legal Requirements:</span> When required to comply
                    with applicable law, regulation, or legal process.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We do not share information for marketing purposes.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">4. Third-Party Links</h2>
                <p className="text-muted-foreground leading-relaxed">
                  HenryHarrisonPlanoTexas.com may contain links to external websites. We are not responsible for the
                  content, privacy practices, or policies of third-party sites. We encourage you to review their policies
                  individually.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use reasonable administrative, technical, and physical safeguards to protect your information.
                  However, no method of transmission or storage is completely secure, and we cannot guarantee absolute
                  security.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">6. Children’s Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This website is not directed toward individuals under the age of 18. We do not knowingly collect
                  personal information from minors.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">7. Your Choices</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You may choose not to provide information, but doing so may limit your ability to use certain features
                  of the website (such as submitting a Contact form).
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">8. Contacting Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or how your information is handled, please reach out
                  through the Contact Form on our Contact page:
                </p>
                <Link
                  href="https://henryharrisonplanotexas.com/contact/"
                  className="text-primary font-semibold hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://henryharrisonplanotexas.com/contact/
                </Link>
                <p className="text-muted-foreground leading-relaxed">
                  All inquiries must be submitted through the form.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">9. Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
                  “Last Updated” date. Continued use of the website after any changes constitutes acceptance of the
                  revised policy.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

