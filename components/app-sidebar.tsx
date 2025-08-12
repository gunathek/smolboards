"use client"

import * as React from "react"
import { IconCamera, IconDashboard, IconListDetails, IconPlus, IconHelpCircle } from "@tabler/icons-react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: IconDashboard,
    },
  ],
  navManagement: [
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: IconListDetails,
    },
  ],
  navMedia: [
    {
      title: "Gallery",
      url: "/gallery",
      icon: IconCamera,
    },
  ],
  navSecondary: [],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        console.warn("Supabase not configured - using guest mode")
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error getting user:", error)
      } finally {
        setLoading(false)
      }
    }

    if (supabase) {
      getUser()

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/")
        } else {
          setUser(session.user)
        }
      })

      return () => {
        subscription?.unsubscribe()
      }
    } else {
      setLoading(false)
    }
  }, [router])

  const handleSignOut = async () => {
    if (!supabase) {
      console.warn("Cannot sign out - Supabase not configured")
      router.push("/")
      return
    }

    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                <a href="/home">
                  <Logo className="h-5 text-white" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavDocuments items={data.documents} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </SidebarFooter>
      </Sidebar>
    )
  }

  const userData = user
    ? {
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "/avatars/default.jpg",
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/avatars/default.jpg",
      }

  return (
    <TooltipProvider>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                <a href="/home">
                  <Logo className="h-5 text-white" uniColor />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Smolboards
            </div>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Management
            </div>
            <SidebarMenu>
              {data.navManagement.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Media</div>
            <SidebarMenu>
              {data.navMedia.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* New Campaign Button */}
          <div className="mx-2 mb-3">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Link href="/campaigns/new">
                <IconPlus className="h-4 w-4 mr-2" />
                New Campaign
              </Link>
            </Button>
          </div>

          {/* Credit Balance Block */}
          <div className="mx-2 mb-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Credits</span>
                <Tooltip>
                  <TooltipTrigger>
                    <IconHelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                      I'm a pre-paid system. You buy credits, and these credits are exchanged for ads in your campaign.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-6 px-2 bg-transparent">
                MANAGE
              </Button>
            </div>
            <div className="text-xl font-bold text-foreground">₹15,000.00</div>
          </div>

          <NavUser user={userData} onSignOut={handleSignOut} />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
