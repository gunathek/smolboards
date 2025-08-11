"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowLeft, Search, Plus, Minus, MapPin, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BillboardSidebar, type BillboardFilters } from "@/components/billboard-sidebar"
import { BookingDialog } from "@/components/booking-dialog"
import { supabase, type Billboard, initializeBillboards, createSampleBillboards } from "@/lib/supabase"
import { MapStats } from "@/components/map-stats"

// Fallback billboard data in case Supabase is not available
const fallbackBillboards: Billboard[] = [
  {
    id: "1",
    name: "Forum Mall Digital Board",
    lat: 12.9279,
    lng: 77.6271,
    dimensions: "20x10 ft",
    daily_rate: 150.0,
    monthly_rate: 4000.0,
    hourly_rate: 20.0,
    impressions: 5000,
    cost_per_play: 10,
    resolution: "1920x1080",
    provider: "Ad-tastic",
    category: "Shopping Mall",
    address: "Forum Mall, Hosur Road, Koramangala, Bengaluru",
    description: "High-traffic digital billboard at main entrance",
    status: "available",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Koramangala Social Facade",
    lat: 12.9351,
    lng: 77.6269,
    dimensions: "15x8 ft",
    daily_rate: 120.0,
    monthly_rate: 3200.0,
    hourly_rate: 15.0,
    impressions: 3000,
    cost_per_play: 8,
    resolution: "1280x720",
    provider: "Social Screens",
    category: "Restaurant",
    address: "Koramangala Social, 5th Block, Koramangala, Bengaluru",
    description: "Premium location with young demographic",
    status: "available",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "BDA Complex Board",
    lat: 12.9368,
    lng: 77.6214,
    dimensions: "25x12 ft",
    daily_rate: 200.0,
    monthly_rate: 5500.0,
    hourly_rate: 25.0,
    impressions: 7000,
    cost_per_play: 12,
    resolution: "2560x1440",
    provider: "Govt Ads",
    category: "Government",
    address: "BDA Complex, Koramangala, Bengaluru",
    description: "Large format billboard with government visibility",
    status: "occupied",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Jyoti Nivas Junction",
    lat: 12.9298,
    lng: 77.6174,
    dimensions: "18x9 ft",
    daily_rate: 130.0,
    monthly_rate: 3500.0,
    hourly_rate: 18.0,
    impressions: 4000,
    cost_per_play: 9,
    resolution: "1920x1080",
    provider: "Campus Ads",
    category: "Educational",
    address: "Near Jyoti Nivas College, Koramangala, Bengaluru",
    description: "Student-focused advertising location",
    status: "available",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Koramangala Metro Station",
    lat: 12.9342,
    lng: 77.6378,
    dimensions: "22x11 ft",
    daily_rate: 180.0,
    monthly_rate: 4800.0,
    hourly_rate: 22.0,
    impressions: 6000,
    cost_per_play: 11,
    resolution: "1920x1080",
    provider: "Metro Ads",
    category: "Transportation",
    address: "Koramangala Metro Station, Bengaluru",
    description: "High footfall metro station location",
    status: "available",
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingBillboard, setBookingBillboard] = useState<Billboard | null>(null)
  const router = useRouter()
  const [filters, setFilters] = useState<BillboardFilters>({
    category: "all",
    status: "all",
    minRate: 0,
    maxRate: 1000,
    showOnlyVisible: false,
  })
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for booking messages from map popups
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "openBooking" && event.data.billboardId) {
        const billboard = billboards.find((b) => b.id === event.data.billboardId)
        if (billboard) {
          setBookingBillboard(billboard)
          setBookingDialogOpen(true)
        }
      } else if (event.data.type === "selectBillboard" && event.data.billboardId) {
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
        .eq('showup', true) // Filter by showup = true
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
        const shownBillboards = data.filter(b => b.showup)
        const maxRate = Math.max(...shownBillboards.map((b) => b.daily_rate), 1000);
        setBillboards(shownBillboards)
        setFilters(prev => ({...prev, maxRate: maxRate}));
        console.log("Fetched billboards:", shownBillboards) // Log fetched data
        console.log(`Loaded ${shownBillboards.length} billboards from database`)
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
      (billboard) =>
        billboard.lat >= south &&
        billboard.lat <= north &&
        billboard.lng >= west &&
        billboard.lng <= east,
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
    console.log("Billboard selected:", billboard.name) // Debug log
    setSelectedBillboard(billboard)
    setMapCenter([billboard.lat, billboard.lng])
    setMapZoom(16)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  const handleMapBoundsChange = (bounds: [[number, number], [number, number]]) => {
    setMapBounds(bounds)
  }

  const handleRetry = () => {
    fetchBillboards()
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Booking Dialog */}
      <BookingDialog billboard={bookingBillboard} open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />

      {/* Error Alert */}
      {(error || usingFallbackData) && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1002] w-full max-w-md px-4"
          data-error-alert
        >
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {error || "Using demo data. Connect to Supabase for live data."}
              {error && (
                <Button onClick={handleRetry} size="sm" variant="outline" className="ml-2 h-6 text-xs bg-transparent">
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Billboard Sidebar */}
      <div data-sidebar>
        <BillboardSidebar
          billboards={billboards}
          visibleBillboards={visibleBillboards}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onBillboardSelect={handleBillboardSelect}
          selectedBillboard={selectedBillboard}
          onFilterChange={setFilters}
          filters={filters}
        />
      </div>

      {/* Map Component */}
      <div
        className={`transition-all duration-300 relative z-0 ${sidebarOpen ? "md:ml-80" : "md:ml-80"}`}
        data-map-container
      >
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          billboards={billboards}
          selectedBillboard={selectedBillboard}
          onBoundsChange={handleMapBoundsChange}
          filters={filters}
        />
      </div>

      {/* Floating Back Button - Top Left */}
      <div
        className={`absolute top-4 z-[1000] transition-all duration-300 ${
          error || usingFallbackData ? "top-20" : "top-4"
        } ${sidebarOpen ? "left-[21rem]" : "left-[21rem]"} md:left-[21rem]`}
        data-back-button
      >
        <Button
          onClick={handleBack}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-black hover:bg-white-50 text-white-700 border border-gray-200"
          variant="default"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Go back</span>
        </Button>
      </div>

      {/* Floating Search Bar - Top Center */}
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4 transition-all duration-300 ${
          error || usingFallbackData ? "top-20" : "top-4"
        }`}
        data-search-container
      >
        <div className="relative">
          <Card className="p-0 shadow-lg border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search in Koramangala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                onFocus={() => searchQuery && setShowResults(true)}
              />
            </div>
          </Card>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full shadow-lg border-gray-200 max-h-60 overflow-y-auto z-[1001]">
              <div className="p-2">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-start gap-3"
                  >
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {result.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.display_name.split(",").slice(1, 3).join(", ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Zoom Controls - Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2" data-zoom-controls>
        <Button
          onClick={handleZoomIn}
          size="icon"
          className="h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Zoom in</span>
        </Button>
        <Button
          onClick={handleZoomOut}
          size="icon"
          className="h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
          variant="outline"
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Zoom out</span>
        </Button>
      </div>

      {/* Floating Map Stats - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-[1000]" data-stats-container>
        <MapStats visibleCount={visibleBillboards.length} totalCount={billboards.length} />
      </div>

      {/* Click overlay to close search results */}
      {showResults && <div className="absolute inset-0 z-[999]" onClick={() => setShowResults(false)} />}

      
    </div>
  )
}
