"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import HeroSection from "@/components/hero-section"
import StatsSection from "@/components/stats"
import FeaturesSection from "@/components/features-8"
import Footer from "@/components/ui/animated-footer"
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background"

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

    // Listen for auth state changes
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
  )
}
