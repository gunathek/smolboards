"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Filter, X, Ruler, DollarSign, MapPin, Eye, Calendar, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { BookingDialog } from "./booking-dialog"
import type { Billboard } from "@/lib/supabase"

interface BillboardSidebarProps {
  billboards: Billboard[]
  visibleBillboards: Billboard[]
  isOpen: boolean
  onToggle: () => void
  onBillboardSelect: (billboard: Billboard) => void
  selectedBillboard: Billboard | null
  onFilterChange: (filters: BillboardFilters) => void
  filters: BillboardFilters
}

export interface BillboardFilters {
  category: string
  status: string
  minRate: number
  maxRate: number
  showOnlyVisible: boolean
}

export function BillboardSidebar({
  billboards,
  visibleBillboards,
  isOpen,
  onToggle,
  onBillboardSelect,
  selectedBillboard,
  onFilterChange,
}: BillboardSidebarProps) {
  const [filters, setFilters] = useState<BillboardFilters>({
    category: "all",
    status: "all",
    minRate: 0,
    maxRate: 100000,
    showOnlyVisible: true,
  })

    const [filteredBillboards, setFilteredBillboards] = useState<Billboard[]>([])
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)

  // Get unique categories from all billboards
  const categories = Array.from(new Set(billboards.map((b) => b.category)))
  const statuses = ["available", "occupied", "maintenance"]

  // Apply filters and update filtered billboards
  useEffect(() => {
    let filtered = filters.showOnlyVisible ? visibleBillboards : billboards

    if (filters.category !== "all") {
      filtered = filtered.filter((b) => b.category === filters.category)
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((b) => b.status === filters.status)
    }

    filtered = filtered.filter((b) => b.daily_rate >= filters.minRate && b.daily_rate <= filters.maxRate)

    setFilteredBillboards(filtered)
    onFilterChange(filters)
  }, [filters, billboards, visibleBillboards, onFilterChange])

  // Auto-scroll to selected billboard
  useEffect(() => {
    if (selectedBillboard) {
      const billboardElement = document.getElementById(`billboard-${selectedBillboard.id}`)
      if (billboardElement) {
        billboardElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [selectedBillboard])

  const updateFilter = (key: keyof BillboardFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      category: "all",
      status: "all",
      minRate: 0,
      maxRate: 100000,
      showOnlyVisible: true,
    })
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.category !== "all" ||
      filters.status !== "all" ||
      filters.minRate !== 0 ||
      filters.maxRate !== 100000 ||
      !filters.showOnlyVisible
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-white text-black border border-gray-300"
      case "occupied":
        return "bg-gray-800 text-white border border-gray-600"
      case "maintenance":
        return "bg-gray-600 text-white border border-gray-500"
      default:
        return "bg-gray-500 text-white border border-gray-400"
    }
  }

  const handleBillboardClick = (billboard: Billboard, event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    const isBookingButton =
      target.closest("[data-booking-button]") || target.closest("button") || target.closest('[role="dialog"]')

    if (isBookingButton) {
      event.stopPropagation()
      return
    }

    onBillboardSelect(billboard)
  }

  return (
    <>
      {/* Sidebar Toggle Button */}
      <div className="fixed top-20 left-4 z-[1000] md:hidden">
        <Button
          onClick={onToggle}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-black hover:bg-gray-800 text-white border border-gray-700"
          variant="outline"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-black text-white z-[998] transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 overflow-hidden flex flex-col border-r border-gray-800 billboard-sidebar`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Billboard Finder</h2>
            <Button onClick={onToggle} size="icon" variant="ghost" className="md:hidden text-white hover:bg-gray-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-400 mt-1 space-y-1">
            {filters.showOnlyVisible && (
              <div className="flex items-center gap-1 text-xs text-white">
                <Eye className="h-3 w-3" />
                <span>In current view</span>
              </div>
            )}
          </div>
        </div>

        {/* Moved "Show only visible" filter here */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="visible-only"
              checked={filters.showOnlyVisible}
              onCheckedChange={(checked) => updateFilter("showOnlyVisible", checked)}
              className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <label htmlFor="visible-only" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
              <Eye className="h-3 w-3" />
              Show only visible on map
            </label>
          </div>
        </div>

        {/* Filters */}
        <Collapsible className="group/collapsible">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="rounded-lg flex-1 text-left" asChild>
                <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">FILTERS</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              {hasActiveFilters() && (
                <Button
                  onClick={clearAllFilters}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white ml-2"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <CollapsibleContent className="p-4 space-y-4 border-b border-gray-800">
            {/* View Statistics */}

            {/* Category Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 text-white z-[1000]">
                  <SelectItem value="all" className="hover:bg-gray-600 focus:bg-gray-600">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-gray-800 focus:bg-gray-800">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 text-white z-[1000]">
                  <SelectItem value="all" className="hover:bg-gray-600 focus:bg-gray-600">
                    All Status
                  </SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="hover:bg-gray-800 focus:bg-gray-800">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rate Filter */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Daily Rate: ₹{filters.minRate} - ₹{filters.maxRate}
              </label>
              <div className="px-2">
                <Slider
                  value={[filters.minRate, filters.maxRate]}
                  onValueChange={([min, max]) => {
                    updateFilter("minRate", min)
                    updateFilter("maxRate", max)
                  }}
                  max={100000}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Billboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredBillboards.map((billboard) => (
            <Card
              key={billboard.id}
              id={`billboard-${billboard.id}`}
              className={`bg-gray-900 border-gray-800 cursor-pointer transition-all hover:bg-gray-800 ${
                selectedBillboard?.id === billboard.id ? "ring-2 ring-white bg-gray-800" : ""
              }`}
              onClick={(e) => handleBillboardClick(billboard, e)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">{billboard.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {billboard.address}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(billboard.status)}`}>{billboard.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {billboard.dimensions}
                  </div>
                  <div className="flex items-center gap-1">
                    ₹{billboard.cost_per_play}/play
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500">{billboard.category}</div>
                  <div className="text-xs text-white font-medium flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {billboard.impressions}
                  </div>
                </div>

                {billboard.description && (
                  <div className="mb-3 text-xs text-gray-400 italic line-clamp-2">{billboard.description}</div>
                )}

                {/* Book Now Button */}
                {billboard.status === "available" && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <BookingDialog
                      billboard={billboard}
                      open={selectedBillboard?.id === billboard.id && isBookingDialogOpen}
                      onOpenChange={setIsBookingDialogOpen}
                    >
                      <Button
                        data-booking-button="true"
                        size="sm"
                        className="w-full bg-white hover:bg-gray-200 text-black border border-gray-300"
                        onClick={() => {
                          onBillboardSelect(billboard)
                          setIsBookingDialogOpen(true)
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Book Now
                      </Button>
                    </BookingDialog>
                  </div>
                )}

                {billboard.status !== "available" && (
                  <Button size="sm" className="w-full bg-gray-800 text-gray-400 border border-gray-700" disabled>
                    {billboard.status === "occupied" ? "Currently Occupied" : "Under Maintenance"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredBillboards.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No billboards match your filters</p>
              {filters.showOnlyVisible && <p className="text-xs mt-1">Try zooming out or adjusting filters</p>}
              {hasActiveFilters() && (
                <Button
                  onClick={clearAllFilters}
                  size="sm"
                  variant="outline"
                  className="mt-3 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-400">
            Viewing {Math.min(filteredBillboards.length, 50)} of {filteredBillboards.length} results
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[997] md:hidden" onClick={onToggle} />}
    </>
  )
}
