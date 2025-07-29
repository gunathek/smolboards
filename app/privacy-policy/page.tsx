import { HeroHeader } from '@/components/header';
import Footer from "@/components/ui/animated-footer";

export default function PrivacyPolicy() {
  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Last Updated: 29 July 2025
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl border border-border/50 p-6 sm:p-8 lg:p-10">
              <div className="space-y-8 text-foreground/90">
                <section>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-6">
                    Smolboards.com (operated by Smolboards Pvt. Ltd., "we", "us", "our") takes your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our website and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    1. Information We Collect
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    We collect both Personal Information and Sensitive Personal Data or Information (SPDI) as defined under Indian regulations:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li><span className="font-medium text-foreground">Personal Information:</span> name, email address, mobile number, postal address, and any information provided during registration, surveys, support interactions, or transactions.</li>
                    <li><span className="font-medium text-foreground">SPDI:</span> payment details, bank account data, government-issued ID numbers, biometric or health data (only when provided voluntarily and with your consent).</li>
                    <li><span className="font-medium text-foreground">Usage Data:</span> IP address, browser type, device information, pages visited, duration, via cookies, web logs, and analytics.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    2. How We Collect Your Data
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Directly from you when you register, sign up, complete forms, contact support, or transact.</li>
                    <li>Automatically through cookies, tracking tools, server logs, analytics, and similar technologies.</li>
                    <li>From third-party services (e.g. payment gateways, analytics providers), with your consent where required and only for legitimate purposes.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    3. Purpose of Data Collection & Use
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    We process your data for purposes including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Providing, managing, improving, and personalizing Smolboards services.</li>
                    <li>Processing payments, billing, and subscription administration.</li>
                    <li>Communicating important service notices and responding to queries.</li>
                    <li>Delivering marketing and promotional offers (only with your prior consent; opt-out available).</li>
                    <li>Complying with laws, regulations, and court orders in India.</li>
                    <li>Detecting fraud, improving security, performance, and user experience.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    4. Disclosure of Your Information
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    We may share your data with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Service providers (e.g. hosting, payment processors, analytics, customer support), who are contractually bound to maintain confidentiality and use your data only as instructed.</li>
                    <li>Legal, regulatory, or governmental authorities in India if required by law or court order.</li>
                    <li>Affiliates or during business transfers, mergers, or acquisitions, provided confidentiality obligations remain intact.</li>
                  </ul>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mt-4">
                    We do not sell or lease your personal information to third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    5. Cookies & Tracking Technologies
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    We utilize cookies and similar tracking mechanisms to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Maintain user sessions and authentication.</li>
                    <li>Gather site usage analytics to enhance performance and user experience.</li>
                    <li>Provide personalized content and advertising where permitted by consent.</li>
                  </ul>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mt-4">
                    You can manage or disable cookies through browser settings; note that some features may not function correctly without them.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    6. Data Storage & Retention
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Your data is securely stored on servers located in India or in countries with adequate data protection laws.</li>
                    <li>We retain your personal data for the duration of your active account or subscription, and longer if required to resolve disputes, enforce disputes, or meet legal obligations.</li>
                    <li>Once no longer needed, data is either securely deleted or anonymized.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    7. Data Security Measures
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    We follow industry-standard security practices under Indian law, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Encryption of sensitive data both in transit and at rest.</li>
                    <li>Restricting access to authorized personnel only.</li>
                    <li>Conducting periodic audits, vulnerability assessments, and maintaining secure systems.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    8. Your Rights Under Indian Data Privacy Laws
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    You have the following rights:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-muted-foreground ml-4">
                    <li>Access the personal information we hold about you.</li>
                    <li>Correct or update your information.</li>
                    <li>Request deletion or erasure—subject to legal obligations.</li>
                    <li>Restrict or object to certain data processing activities.</li>
                    <li>Withdraw consent for processing where consent was initially required.</li>
                  </ul>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mt-4">
                    Requests can be directed to support@smolboards.com or via our support portal. We may verify your identity before processing.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    9. Children's Privacy
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    Our services are intended for individuals aged 18 and above. We do not knowingly collect personal data from minors under 18. If you believe we have such data, please contact us so we can remove it promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    10. Changes to This Privacy Policy
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    We may update this Privacy Policy to reflect new practices, legal changes, or service modifications. Any revisions will be posted with an updated "Last Updated" date. Continued use of our services after changes indicates acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
                    11. Contact Us
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4">
                    For any questions, complaints, or requests about this Privacy Policy or your personal data, please contact:
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
