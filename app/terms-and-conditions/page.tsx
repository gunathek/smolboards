import { HeroHeader } from '@/components/header';
import Footer from "@/components/ui/animated-footer";

export default function TermsAndConditions() {
  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                Terms & Conditions
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Last Updated: July 29th 2025
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl border border-border/50 p-6 sm:p-8 lg:p-10">
              <div className="space-y-8 text-foreground/90">
                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    1. Agreement to Terms
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    These Terms & Conditions ("Terms") govern your access to and use of Smolboards.com (the "Website"), operated by Smolboards Pvt. Ltd. ("We", "Us", "Our"), a company incorporated under Indian law. By accessing or using the Website, you agree to be bound by these Terms and our Privacy Policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    2. Eligibility
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    You must be at least 18 years old and legally capable of entering a binding agreement under Indian law. If you're using the Website on behalf of an entity, you represent you have authority to bind that entity to these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    3. Scope & Changes
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    These Terms apply to all Website content, features, functionality, and services. We may revise these Terms at any time by posting updates on the Website. Your continued use of the Website after changes implies your acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    4. Intellectual Property
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    All content on the Website- including software, graphics, text, logos, trademarks, trade names, and design is owned or licensed by Smolboards Pvt. Ltd. and protected by Indian and international intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without prior written consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    5. User Accounts & Registration
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    If you register for an account, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorized use.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    6. Acceptable Use
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    You may use the Website only for lawful purposes and must comply with applicable Indian laws including the Information Technology Act, 2000. You agree not to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Post defamatory, obscene, offensive, or illegal content</li>
                    <li>Impersonate others or falsely claim affiliation</li>
                    <li>Transmit spam, viruses, or malware</li>
                    <li>Attempt unauthorized access to systems or data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    7. Suspension & Termination
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    We reserve the right to suspend or terminate your account or access at our discretion, if we believe you've violated these Terms or engaged in harmful behavior. You may also deactivate your account at any time, but paid features or content may not be refundable.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    8. Services, Payment & Subscription
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    If the Website offers paid services or subscriptions, you will be charged as described at checkout. Payment may be made by card, digital wallet, or other means accepted by us. Recurring subscriptions will auto-renew unless canceled per instructions. No refunds unless required by law or specified otherwise.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    9. Warranty Disclaimer
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    The Website and services are provided "as is" and "as available" without warranties of any kind, express or implied. To the extent allowed by law, we disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    10. Limitation of Liability
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    To the maximum extent permitted by law, Smolboards Pvt. Ltd. shall not be liable for indirect, incidental, special, punitive or consequential damages, loss of profits, or loss of data. Our total liability under these Terms will not exceed the amount paid by you to us in the 12 months preceding the claim.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    11. Governing Law & Dispute Resolution
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    These Terms are governed by the laws of the Republic of India. Any dispute will be resolved by arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed in Bengaluru. Arbitration proceedings will be conducted in English.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    12. Indemnification
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    You agree to indemnify and hold harmless Smolboards Pvt. Ltd., its directors, employees, and affiliates from any claims, damages or losses arising from your violation of these Terms or misuse of the Website.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    13. Modifications and Interruptions
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    We may introduce changes, enhancements, or interruptions to the Website at any time. We are not liable if the service experiences downtime or technical issues due to maintenance or external factors.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    14. Privacy Policy & Cookies
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    Our Privacy Policy explains how we collect, use, and safeguard your personal information. You acknowledge reading and accepting it by using the Website.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    15. Corrections & Inaccuracies
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    We attempt to ensure information on the Website is accurate, but we do not promise it will be error-free. We may correct or revise content at any time without notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    16. Contact Information
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  <div className="text-sm sm:text-base text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Smolboards Pvt. Ltd.</p>
                    <p>White Gate Building, Adugodi, Bengaluru, Karnataka, India</p>
                    <p>Email: support@smolboards.com</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer 
        leftLinks={[]}
        rightLinks={[]}
        copyrightText="Smolboards 2025. All Rights Reserved"
        barCount={23} 
      />
    </>
  );
}
