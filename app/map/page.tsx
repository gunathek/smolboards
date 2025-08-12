"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase, type Billboard, initializeBillboards, createSampleBillboards } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

import { BillboardListSidebar } from "@/components/billboard-list-sidebar"
import { BillboardDetailsSidebar } from "@/components/billboard-details-sidebar"
import { SelectionFloatingButton } from "@/components/selection-floating-button"
import { LoginBanner } from "@/components/login-banner"

// Fallback billboard data in case Supabase is not available
const fallbackBillboards: Billboard[] = [
  {
    id: "1",
    name: "Forum Mall Digital Board",
    provider: "Digital Displays Inc",
    lat: 12.9279,
    lng: 77.6271,
    dimensions: "20x10 ft",
    resolution: "1920x1080",
    orientation: "landscape",
    category: "Shopping Mall",
    address: "Forum Mall, Hosur Road, Koramangala, Bengaluru",
    description: "High-traffic digital billboard at main entrance",
    tags: "mall,shopping,high-traffic",
    loop_time: 300,
    start_hour: 8,
    end_hour: 22,
    supported_media: "video,image",
    impressions: 5000,
    cost_per_play: 0.5,
    hourly_rate: 25.0,
    daily_rate: 150.0,
    monthly_rate: 4000.0,
    status: "available",
    showup: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Koramangala Social Facade",
    provider: "Urban Media Solutions",
    lat: 12.9351,
    lng: 77.6269,
    dimensions: "15x8 ft",
    resolution: "1080x720",
    orientation: "landscape",
    category: "Restaurant",
    address: "Koramangala Social, 5th Block, Koramangala, Bengaluru",
    description: "Premium location with young demographic",
    tags: "restaurant,social,young-crowd",
    loop_time: 180,
    start_hour: 10,
    end_hour: 24,
    supported_media: "video,image",
    impressions: 3500,
    cost_per_play: 0.4,
    hourly_rate: 20.0,
    daily_rate: 120.0,
    monthly_rate: 3200.0,
    status: "available",
    showup: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "BDA Complex Board",
    provider: "Government Advertising Board",
    lat: 12.9368,
    lng: 77.6214,
    dimensions: "25x12 ft",
    resolution: "2560x1440",
    orientation: "landscape",
    category: "Government",
    address: "BDA Complex, Koramangala, Bengaluru",
    description: "Large format billboard with government visibility",
    tags: "government,official,high-visibility",
    loop_time: 600,
    start_hour: 6,
    end_hour: 20,
    supported_media: "image",
    impressions: 8000,
    cost_per_play: 0.75,
    hourly_rate: 35.0,
    daily_rate: 200.0,
    monthly_rate: 5500.0,
    status: "occupied",
    showup: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Jyoti Nivas Junction",
    provider: "Campus Media Networks",
    lat: 12.9298,
    lng: 77.6174,
    dimensions: "18x9 ft",
    resolution: "1920x1080",
    orientation: "landscape",
    category: "Educational",
    address: "Near Jyoti Nivas College, Koramangala, Bengaluru",
    description: "Student-focused advertising location",
    tags: "college,students,education",
    loop_time: 240,
    start_hour: 7,
    end_hour: 21,
    supported_media: "video,image",
    impressions: 4200,
    cost_per_play: 0.35,
    hourly_rate: 22.0,
    daily_rate: 130.0,
    monthly_rate: 3500.0,
    status: "available",
    showup: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Koramangala Metro Station",
    provider: "Transit Advertising Corp",
    lat: 12.9342,
    lng: 77.6378,
    dimensions: "22x11 ft",
    resolution: "2048x1024",
    orientation: "landscape",
    category: "Transportation",
    address: "Koramangala Metro Station, Bengaluru",
    description: "High footfall metro station location",
    tags: "metro,transport,commuters",
    loop_time: 400,
    start_hour: 5,
    end_hour: 23,
    supported_media: "video,image",
    impressions: 10000,
    cost_per_play: 0.6,
    hourly_rate: 30.0,
    daily_rate: 180.0,
    monthly_rate: 4800.0,
    status: "available",
    showup: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("../map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

export default function KoramangalaMap() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9352, 77.6245])
  const [mapZoom, setMapZoom] = useState(14)
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null)
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [visibleBillboards, setVisibleBillboards] = useState<Billboard[]>([])
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [selectedBillboards, setSelectedBillboards] = useState<Set<string>>(new Set())
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const router = useRouter()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setAuthLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null)
      })

      return () => subscription?.unsubscribe()
    }
  }, [])

  // Listen for billboard selection messages from map
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "selectBillboard") {
        const billboard = billboards.find((b) => b.id === event.data.billboardId)
        if (billboard) {
          handleBillboardSelect(billboard)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [billboards])

  // Fetch billboards from Supabase with fallback
  useEffect(() => {
    fetchBillboards()
  }, [])

  const fetchBillboards = async () => {
    setLoading(true)
    setError(null)

    try {
      // First check if the table exists
      const initResult = await initializeBillboards()

      if (!initResult.success) {
        console.warn("Supabase table check failed, using fallback data:", initResult.error)
        setBillboards(fallbackBillboards)
        setUsingFallbackData(true)
        setLoading(false)
        return
      }

      // Check if supabase is available
      if (!supabase) {
        console.warn("Supabase client is not available, using fallback data")
        setBillboards(fallbackBillboards)
        setUsingFallbackData(true)
        setLoading(false)
        return
      }

      // Try to fetch billboards
      const { data, error: fetchError } = await supabase
        .from("billboards")
        .select("*")
        .eq("showup", true) // Filter by showup = true
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("Error fetching billboards:", fetchError)

        // If table is empty, try to create sample data
        if (fetchError.message.includes("relation") || fetchError.message.includes("does not exist")) {
          setError("Database table not found. Please run the SQL script to create the billboards table.")
        } else {
          setError(`Database error: ${fetchError.message}`)
        }

        // Use fallback data
        setBillboards(fallbackBillboards)
        setUsingFallbackData(true)
      } else if (!data || data.length === 0) {
        // Table exists but is empty, try to create sample data
        console.log("Table is empty, creating sample data...")
        const sampleResult = await createSampleBillboards()

        if (sampleResult.success && sampleResult.data) {
          setBillboards(sampleResult.data)
        } else {
          setBillboards(fallbackBillboards)
          setUsingFallbackData(true)
        }
      } else {
        const shownBillboards = data.filter((b) => b.showup)
        const maxRate = Math.max(...shownBillboards.map((b) => b.daily_rate), 1000)
        setBillboards(shownBillboards)
        // console.log("Fetched billboards:", shownBillboards) // Log fetched data
        // console.log(`Loaded ${shownBillboards.length} billboards from database`)
      }
    } catch (error) {
      console.error("Error in fetchBillboards:", error)
      setError("Failed to connect to database. Using demo data.")
      setBillboards(fallbackBillboards)
      setUsingFallbackData(true)
    } finally {
      setLoading(false)
    }
  }

  // Update visible billboards when map bounds change
  useEffect(() => {
    if (!mapBounds || billboards.length === 0) return

    const [[south, west], [north, east]] = mapBounds
    const visible = billboards.filter(
      (billboard) => billboard.lat >= south && billboard.lat <= north && billboard.lng >= west && billboard.lng <= east,
    )

    setVisibleBillboards(visible)
  }, [mapBounds, billboards])

  // Search functionality using Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + " Koramangala Bengaluru",
        )}&limit=5&bounded=1&viewbox=77.6000,12.9500,77.6500,12.9200`,
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSearchSelect = (result: any) => {
    const lat = Number.parseFloat(result.lat)
    const lon = Number.parseFloat(result.lon)
    setMapCenter([lat, lon])
    setMapZoom(16)
    setSearchQuery(result.display_name.split(",")[0])
    setShowResults(false)
  }

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.max(prev - 1, 10))
  }

  const handleBack = () => {
    router.push("/")
  }

  const handleBillboardSelect = (billboard: Billboard) => {
    setSelectedBillboard(billboard)
    setMapCenter([billboard.lat, billboard.lng])
    setMapZoom(16)
    setRightSidebarOpen(true)
    setLeftSidebarOpen(false) // Close left sidebar on mobile
  }

  const handleBillboardToggleSelection = (billboardId: string) => {
    setSelectedBillboards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(billboardId)) {
        newSet.delete(billboardId)
      } else {
        newSet.add(billboardId)
      }
      return newSet
    })
  }

  const handleMapBoundsChange = (bounds: [[number, number], [number, number]]) => {
    setMapBounds(bounds)
  }

  const handleRetry = () => {
    fetchBillboards()
  }

  const handleCloseRightSidebar = () => {
    setRightSidebarOpen(false)
    setSelectedBillboard(null)
  }

  const handleBackdropClick = () => {
    if (rightSidebarOpen) {
      handleCloseRightSidebar()
    }
  }

  if (loading || authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gray-100">
      {/* Search Bar */}
      <div
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[800] ${rightSidebarOpen ? "blur-sm" : ""}`}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for a city or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">IN</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Left Sidebar - Billboard List */}
      <div className={rightSidebarOpen ? "blur-sm" : ""}>
        <BillboardListSidebar
          billboards={billboards}
          visibleBillboards={visibleBillboards}
          isOpen={true} // Always keep sidebar open
          onToggle={() => {}} // Remove toggle functionality
          onBillboardSelect={handleBillboardSelect}
          onBillboardToggleSelection={handleBillboardToggleSelection}
          selectedBillboards={selectedBillboards}
          selectedBillboard={selectedBillboard}
          isAuthenticated={!!user}
        />
      </div>

      {/* Right Sidebar - Billboard Details */}
      <BillboardDetailsSidebar
        billboard={selectedBillboard}
        isOpen={rightSidebarOpen}
        onClose={handleCloseRightSidebar}
        onToggleSelection={handleBillboardToggleSelection}
        isSelected={selectedBillboard ? selectedBillboards.has(selectedBillboard.id) : false}
        isAuthenticated={!!user}
      />

      {rightSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[900] transition-all duration-300"
          onClick={handleBackdropClick}
        />
      )}

      {/* Map Container */}
      <div
        className={`transition-all duration-300 relative z-0 ml-80 ${
          rightSidebarOpen ? "md:mr-96 blur-sm" : "md:mr-0"
        }`}
      >
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          billboards={billboards}
          selectedBillboard={selectedBillboard}
          selectedBillboards={selectedBillboards}
          onBoundsChange={handleMapBoundsChange}
        />
      </div>

      {/* Selection Button / Login Banner */}
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[800] ${rightSidebarOpen ? "blur-sm" : ""}`}
      >
        {!authLoading && (
          <>
            {user ? (
              <SelectionFloatingButton
                selectedCount={selectedBillboards.size}
                onViewSelection={() => {
                  // Handle view selection
                  console.log("View selection clicked")
                }}
              />
            ) : (
              <LoginBanner
                onLogin={() => {
                  window.location.href = "/auth"
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
