import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "DMCA Policy | PickleballCourts.io",
  description:
    "DMCA policy for PickleballCourts.io explaining how to submit copyright notices and counter-notifications.",
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Effective Date: December 11, 2025</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">DMCA Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              PickleballCourts.io is owned and operated by Shield Web Services, LLC.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We respect the intellectual property rights of others and expect our users to do the same. It is our policy to respond to clear notices of alleged copyright infringement in accordance with the Digital Millennium Copyright Act ("DMCA"), 17 U.S.C. § 512.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">Reporting Claims of Copyright Infringement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you believe that any content appearing on PickleballCourts.io infringes your copyright, please send a written notice to our Designated DMCA Agent containing the following information:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground ml-4">
                  <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf;</li>
                  <li>Identification of the copyrighted work claimed to have been infringed (or, if multiple works are involved, a representative list);</li>
                  <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity, including the specific URL(s) on PickleballCourts.io where the material appears;</li>
                  <li>Your contact information, including your name, address, telephone number, and email address;</li>
                  <li>A statement that you have a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law;</li>
                  <li>A statement, made under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorized to act on behalf of the owner.</li>
                </ol>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">Send the notice to our Designated DMCA Agent:</h2>
                <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                  <p className="text-foreground font-semibold">Shield Web Services, LLC</p>
                  <p className="text-foreground font-semibold">DMCA Agent</p>
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
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Please include "DMCA Notice" in the subject line of your email.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">Counter-Notification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you believe that material you posted on PickleballCourts.io was removed or disabled by mistake or misidentification, you may file a counter-notification with our DMCA Agent. Your counter-notification must include:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground ml-4">
                  <li>Your physical or electronic signature;</li>
                  <li>Identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access to it was disabled;</li>
                  <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled;</li>
                  <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of Federal District Court for the judicial district in which your address is located, or if your address is outside of the United States, for any judicial district in which Shield Web Services, LLC may be found, and that you will accept service of process from the person who provided notification of the alleged infringement.</li>
                </ol>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">Repeat Infringers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  It is our policy to terminate, in appropriate circumstances, the accounts of users who are repeat infringers of copyright.
                </p>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">No Legal Advice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This policy is provided for informational purposes only and does not constitute legal advice. If you believe your copyright has been infringed, you should consult with an attorney.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
