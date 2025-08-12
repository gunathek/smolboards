import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-4 ml-auto">
            <a
              href="/map"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Map of Boards
            </a>
            <a
              href="/cost-estimator"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cost Estimator
            </a>
            <a
              href="/help"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Help Center
            </a>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
