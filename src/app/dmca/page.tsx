import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "DMCA Policy | HenryHarrisonPlanoTexas.com",
  description:
    "DMCA policy for HenryHarrisonPlanoTexas.com explaining how to submit copyright notices and counter-notifications.",
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Updated: 12-4-25</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">DMCA Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              HenryHarrisonPlanoTexas.com (“we,” “us,” or “our”) respects the intellectual
              property rights of others and expects all users and businesses listed in our
              directory to do the same. In accordance with the Digital Millennium Copyright
              Act (“DMCA”) and applicable laws, we respond to valid copyright infringement
              notices and take appropriate action where required. This policy outlines how
              copyright owners can notify us of alleged infringement and how we handle such
              notices.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">1. Use of Images and Third-Party Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Some images and visual assets displayed on HenryHarrisonPlanoTexas.com may be:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Provided directly by the businesses featured in our directory</li>
                  <li>Submitted by users through forms</li>
                  <li>Publicly available resources</li>
                  <li>Obtained through Google’s API or other licensed content sources</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  While we take reasonable steps to source images responsibly, we do not claim ownership
                  of third-party content and remain committed to resolving copyright concerns promptly
                  and lawfully.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">2. Filing a DMCA Takedown Notice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you believe that your copyrighted work has been used on our website without authorization,
                  you may submit a DMCA takedown request. Your notice must include:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Identification of the copyrighted work you believe has been infringed.</li>
                  <li>Identification of the material on our site that you believe is infringing, including the exact URL.</li>
                  <li>Your contact information, including your full name.</li>
                  <li>
                    A statement that you have a good faith belief that the use of the material is not authorized by the
                    copyright owner, its agent, or the law.
                  </li>
                  <li>
                    A statement, under penalty of perjury, that the information you are providing is accurate and that you
                    are the copyright owner or authorized to act on the owner’s behalf.
                  </li>
                  <li>Your physical or electronic signature.</li>
                </ul>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">3. How to Submit a DMCA Notice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All copyright-related inquiries must be submitted exclusively through our Contact Form at:
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
                  Please include “DMCA Notice” in the subject field of the form to ensure proper routing.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">4. Our Response to Valid Notices</h2>
                <p className="text-muted-foreground leading-relaxed">Upon receiving a valid DMCA notice, we may:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Remove or disable access to the allegedly infringing content</li>
                  <li>Notify the user or business responsible for the content (if applicable)</li>
                  <li>Take additional action if repeated violations occur</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We may request further information if a notice is incomplete or unclear.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">5. Counter-Notification Process</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If content was removed due to a DMCA notice and you believe the takedown was incorrect or unauthorized,
                  you may submit a counter-notification. It must include:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Identification of the removed material and its former URL</li>
                  <li>A statement, under penalty of perjury, that the material was removed due to mistake or misidentification</li>
                  <li>Your consent to the jurisdiction of applicable courts</li>
                  <li>Your full name and electronic or physical signature</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Counter-notifications must also be submitted through the Contact Form linked above.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">6. Repeat Infringer Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or remove users or businesses who repeatedly violate copyright laws or submit infringing content.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">7. No Legal Advice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This policy is provided for informational purposes and does not constitute legal advice. Individuals or
                  businesses facing copyright-related concerns should consult a qualified attorney.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

