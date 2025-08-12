"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, MousePointer } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for the performance chart
const performanceData = [
  { date: "Jan 1", impressions: 45000, spend: 2100 },
  { date: "Jan 2", impressions: 52000, spend: 2400 },
  { date: "Jan 3", impressions: 48000, spend: 2200 },
  { date: "Jan 4", impressions: 61000, spend: 2800 },
  { date: "Jan 5", impressions: 55000, spend: 2500 },
  { date: "Jan 6", impressions: 67000, spend: 3100 },
  { date: "Jan 7", impressions: 58000, spend: 2700 },
  { date: "Jan 8", impressions: 72000, spend: 3300 },
  { date: "Jan 9", impressions: 65000, spend: 3000 },
  { date: "Jan 10", impressions: 78000, spend: 3600 },
  { date: "Jan 11", impressions: 71000, spend: 3300 },
  { date: "Jan 12", impressions: 84000, spend: 3900 },
  { date: "Jan 13", impressions: 77000, spend: 3500 },
  { date: "Jan 14", impressions: 89000, spend: 4100 },
]

// Mock sparkline data for KPI cards
const sparklineData = [
  { value: 100 },
  { value: 120 },
  { value: 110 },
  { value: 140 },
  { value: 130 },
  { value: 160 },
  { value: 150 },
]

const SparklineChart = ({ data, color = "#8b5cf6" }: { data: any[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
)

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState("7 days")
  const [showSuggestion, setShowSuggestion] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/")
        } else {
          setUser(session.user)
        }
      })

      return () => subscription?.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const timeRanges = ["24 hours", "7 days", "30 days", "12 months", "Custom"]
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"

  return (
    <div className="flex-1 space-y-6 p-6 bg-background">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={selectedRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRange(range)}
              className={`text-xs ${
                selectedRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">People Reached</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">120,450</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                5.2%
              </Badge>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <div className="mt-3">
              <SparklineChart data={sparklineData} color="#10b981" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹8,422.60</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                3.2%
              </Badge>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <div className="mt-3">
              <SparklineChart data={sparklineData} color="#3b82f6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ad Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">350,900</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                <TrendingDown className="h-3 w-3 mr-1" />
                1.8%
              </Badge>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <div className="mt-3">
              <SparklineChart data={sparklineData} color="#ef4444" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ad Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12,340</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                2.4%
              </Badge>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <div className="mt-3">
              <SparklineChart data={sparklineData} color="#8b5cf6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Overall Performance</CardTitle>
              <CardDescription className="text-muted-foreground">
                Ad impressions over the selected time period
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                12 months
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                30 days
              </Button>
              <Button variant="default" size="sm">
                7 days
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                24 hours
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-3xl font-bold text-foreground">350,900</div>
            <div className="flex items-center space-x-2 text-sm">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                3.2%
              </Badge>
              <span className="text-muted-foreground">vs last 7 days</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()}`, "Impressions"]}
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#impressionsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Suggestion Banner */}
      {showSuggestion && (
        <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💡</span>
              <AlertDescription className="text-green-500">
                <strong>Suggestion:</strong> Your campaign 'Summer Sale' has a low CTR. Consider updating your ad
                creative.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestion(false)}
              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
}
