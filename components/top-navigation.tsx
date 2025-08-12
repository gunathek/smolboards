"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calculator, HelpCircle, Map } from "lucide-react"

export function TopNavigation() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-6">
      <div className="flex items-center gap-2 flex-1">{/* Left side - can be empty or contain breadcrumbs */}</div>

      {/* Right side navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map of Boards
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/cost-estimator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cost Estimator
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </Link>
        </Button>
      </div>
    </header>
  )
}
