"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

// Sample data for the dashboard
const dashboardData = [
  {
    "id": 1,
    "header": "Q1 Marketing Campaign",
    "type": "Marketing",
    "status": "Active",
    "target": "Q1 2024",
    "limit": "2024-03-31",
    "reviewer": "John Doe"
  },
  {
    "id": 2,
    "header": "Product Launch",
    "type": "Product",
    "status": "In Review",
    "target": "Q2 2024",
    "limit": "2024-06-30",
    "reviewer": "Jane Smith"
  },
  {
    "id": 3,
    "header": "Annual Report",
    "type": "Finance",
    "status": "Completed",
    "target": "2023",
    "limit": "2024-01-15",
    "reviewer": "Bob Johnson"
  },
  {
    "id": 4,
    "header": "User Research",
    "type": "Research",
    "status": "Active",
    "target": "Q1 2024",
    "limit": "2024-02-28",
    "reviewer": "Alice Brown"
  },
  {
    "id": 5,
    "header": "Security Audit",
    "type": "Security",
    "status": "Pending",
    "target": "Q1 2024",
    "limit": "2024-03-15",
    "reviewer": "Charlie Wilson"
  }
]

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        router.push("/")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/")
      }
    }) || { data: { subscription: null } }

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    if (!supabase) return

    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={dashboardData} />
        </div>
      </div>
    </div>
  )
}
