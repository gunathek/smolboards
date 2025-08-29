"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import HeroSection from "@/components/hero-section"
import StatsSection from "@/components/stats"
import FeaturesSection from "@/components/features-8"
import Footer from "@/components/ui/animated-footer"
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background"
import LogoCloud from "@/components/logo-cloud"
import Pricing from "@/components/pricing"
import FAQsThree from "@/components/faqs-3"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/home")
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.push("/home")
      }
    }) || { data: { subscription: null } }

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

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
        { href: "/terms-and-conditions", label: "Terms & conditions" },
        { href: "/privacy-policy", label: "Privacy policy" },
      ]}
              rightLinks={[
                // { href: "/", label: "Careers" },
                // { href: "/", label: "About" },
                // { href: "/", label: "Help Center" },
                { href: "https://x.com/smolboards", label: "Twitter" },
                { href: "https://instagram.com/trysmolboards", label: "Instagram" },
                { href: "https://linkedin.com/company/smolboards", label: "LinkedIn" }
              ]}
              copyrightText="Smolboards 2025. All Rights Reserved"
              barCount={23} />
    </>
  )
}
