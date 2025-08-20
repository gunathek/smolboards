"use client"

import { useState, useEffect } from "react"
import { Filter, ArrowLeft, Plus, RotateCcw, ChevronDown, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Billboard } from "@/lib/supabase"

interface BillboardListSidebarProps {
  billboards: Billboard[]
  visibleBillboards: Billboard[]
  isOpen: boolean
  onToggle: () => void
  onBillboardSelect: (billboard: Billboard) => void
  onBillboardToggleSelection: (billboardId: string) => void
  selectedBillboards: Set<string>
  selectedBillboard: Billboard | null
  isAuthenticated: boolean
  isCampaignMode?: boolean
  onCampaignBack?: () => void
}

interface BillboardFilters {
  category: string
  status: string
  minRate: number
  maxRate: number
  showOnlyVisible: boolean
}

export function BillboardListSidebar({
  billboards,
  visibleBillboards,
  isOpen,
  onToggle,
  onBillboardSelect,
  onBillboardToggleSelection,
  selectedBillboards,
  selectedBillboard,
  isAuthenticated,
  isCampaignMode = false,
  onCampaignBack,
}: BillboardListSidebarProps) {
  const [filters, setFilters] = useState<BillboardFilters>({
    category: "all",
    status: "all",
    minRate: 0,
    maxRate: 100000,
    showOnlyVisible: true,
  })

  const [filteredBillboards, setFilteredBillboards] = useState<Billboard[]>([])

  // Get unique categories from all billboards
  const categories = Array.from(
    new Set(billboards.map((b) => b.category).filter((cat): cat is string => cat !== undefined && cat !== null)),
  )
  const statuses = ["available", "occupied", "maintenance"]

  // Apply filters
  useEffect(() => {
    let filtered = filters.showOnlyVisible ? visibleBillboards : billboards

    if (filters.category !== "all") {
      filtered = filtered.filter((b) => b.category === filters.category)
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((b) => b.status === filters.status)
    }

    filtered = filtered.filter((b) => (b.daily_rate || 0) >= filters.minRate && (b.daily_rate || 0) <= filters.maxRate)

    setFilteredBillboards(filtered)
  }, [filters, billboards, visibleBillboards])

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

  const hasActiveFilters = () => {
    return (
      filters.category !== "all" ||
      filters.status !== "all" ||
      filters.minRate !== 0 ||
      filters.maxRate !== 100000 ||
      !filters.showOnlyVisible
    )
  }

  const handleBack = () => {
    if (isCampaignMode && onCampaignBack) {
      onCampaignBack()
    } else {
      window.location.href = "/"
    }
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-20 left-4 z-[1000] md:hidden">
        <Button
          onClick={onToggle}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
          variant="outline"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="fixed top-8 left-8 z-[1001]">
        <Button
          onClick={handleBack}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700 text-white border border-slate-600"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={`fixed top-4 left-4 w-96 bg-slate-800 z-[998] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-slate-700 ${isCampaignMode ? "bottom-24" : "bottom-4"}`}
      >
        <div className="flex-1 overflow-y-auto billboard-sidebar-scroll">
          {/* Header - now scrollable */}
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-light text-white mb-2 mt-8">
              {isCampaignMode ? "Select boards for your campaign." : "Find some"}{" "}
              <span className="font-semibold">{isCampaignMode ? "" : "boards."}</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isCampaignMode
                ? `Choose from ${billboards.length} available boards for your campaign.`
                : `There are well over ${billboards.length} boards here. Try using filters to narrow the number of boards I'm showing.`}
            </p>
          </div>

          {/* Filters - now scrollable */}
          <Collapsible className="group/collapsible border-b border-slate-700">
            <div className="p-4">
              <CollapsibleTrigger className="flex-1 text-left w-full" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-green-400 hover:bg-slate-700 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium text-sm">FILTERS</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-4 pb-4 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rate Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
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

              {hasActiveFilters() && (
                <Button
                  onClick={clearAllFilters}
                  size="sm"
                  variant="outline"
                  className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Billboard Cards */}
          <div className="p-4 space-y-3">
            {filteredBillboards.map((billboard) => (
              <Card
                key={billboard.id}
                className={`cursor-pointer transition-all hover:bg-slate-700/50 border-slate-600 bg-slate-700/30 ${
                  selectedBillboard?.id === billboard.id
                    ? "ring-2 ring-green-400 border-green-400"
                    : "hover:border-slate-500"
                }`}
                onClick={() => onBillboardSelect(billboard)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-16 bg-slate-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {billboard.image_url ? (
                          <img
                            src={billboard.image_url || "/placeholder.svg"}
                            alt={billboard.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Image coming</div>
                            <div className="text-xs text-slate-400">soon</div>
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 flex items-end gap-0.5">
                          <div className="w-1 h-2 bg-green-400 rounded-sm"></div>
                          <div className="w-1 h-3 bg-green-400 rounded-sm"></div>
                          <div className="w-1 h-1.5 bg-green-400 rounded-sm"></div>
                          <div className="w-1 h-2.5 bg-green-400 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-white mb-1">
                        ₹{billboard.cost_per_play}+ <span className="text-sm font-normal text-slate-400">/play</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {billboard.category}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>

                      <h3 className="font-medium text-white text-sm mb-1 truncate">{billboard.name}</h3>

                      <p className="text-xs text-slate-400">- {billboard.provider}</p>

                      <p className="text-xs text-slate-500 mt-1 truncate">{billboard.address}</p>
                    </div>

                    {isAuthenticated && billboard.status === "available" && (
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 rounded-full transition-colors ${
                            selectedBillboards.has(billboard.id)
                              ? "border-red-400 text-red-400 hover:bg-red-400/10 bg-transparent"
                              : "border-green-400 text-green-400 hover:bg-green-400/10 bg-transparent"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onBillboardToggleSelection(billboard.id)
                          }}
                        >
                          {selectedBillboards.has(billboard.id) ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredBillboards.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No billboards match your filters</p>
                {hasActiveFilters() && (
                  <Button
                    onClick={clearAllFilters}
                    size="sm"
                    variant="outline"
                    className="mt-3 bg-transparent border-slate-600 text-slate-300"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
