import HeroSection from "@/components/hero-section";
import LogoCloud from '@/components/logo-cloud'
import FeaturesSection from "@/components/features-8";
import StatsSection from '@/components/stats'
import Pricing from '@/components/pricing'
import FAQsThree from '@/components/faqs-3'
import FooterSection from '@/components/footer-section'
import { Comparator } from '@/components/ui/pricing-section-with-comparison'
import Footer from "@/components/ui/animated-footer";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";

export default function Home() {
  return (
    <>
      <AnimatedGradientBackground />
      <HeroSection />
      {/* <LogoCloud /> */}
      <StatsSection />
      <FeaturesSection />
      {/* <Comparator /> */}
      {/* <Pricing /> */}
      {/* <FAQsThree /> */}
      {/* <FooterSection /> */}
      <Footer leftLinks={[
        // { href: "/terms", label: "Terms & policies" },
        // { href: "/privacy-policy", label: "Privacy policy" },
      ]}
              rightLinks={[
                // { href: "/", label: "Careers" },
                // { href: "/", label: "About" },
                // { href: "/", label: "Help Center" },
                // { href: "https://x.com/gunathek", label: "Twitter" },
                // { href: "https://www.instagram.com/", label: "Instagram" },
                // { href: "https://github.com/", label: "GitHub" }
              ]}
              copyrightText="Smolboards 2025. All Rights Reserved"
              barCount={23} />
    </>
  );
}
