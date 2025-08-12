"use client"

import { ArrowLeft, Plus, MapPin, Clock, Monitor, Users, DollarSign, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Billboard } from "@/lib/supabase"

interface BillboardDetailsSidebarProps {
  billboard: Billboard | null
  isOpen: boolean
  onClose: () => void
  onToggleSelection: (billboardId: string) => void
  isSelected: boolean
  isAuthenticated: boolean
}

export function BillboardDetailsSidebar({
  billboard,
  isOpen,
  onClose,
  onToggleSelection,
  isSelected,
  isAuthenticated,
}: BillboardDetailsSidebarProps) {
  if (!billboard) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case "available":
        return "🟢"
      case "occupied":
        return "🔴"
      case "maintenance":
        return "🟡"
      default:
        return "⚪"
    }
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-slate-900 z-[999] transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-hidden flex flex-col border-l border-slate-700 shadow-2xl`}
      >
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Placeholder */}
          <div className="h-48 bg-gradient-to-br from-green-400/20 to-green-600/20 flex items-center justify-center relative">
            <div className="text-center text-green-400">
              <div className="text-4xl mb-2">📺</div>
              <p className="text-sm font-medium">Image coming soon.</p>
            </div>
          </div>

          {/* Billboard Info */}
          <div className="p-6 space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{billboard.category}</span>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">{billboard.name}</h1>
              <p className="text-sm text-slate-400">• {billboard.provider}</p>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Location</span>
              </div>
              <p className="text-sm text-slate-400 ml-6">{billboard.address}</p>
              <Button variant="ghost" size="sm" className="ml-6 mt-1 h-auto p-0 text-green-400 hover:text-green-300">
                <ExternalLink className="h-3 w-3 mr-1" />
                Street View
              </Button>
            </div>

            {/* Availability */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getAvailabilityIcon(billboard.status)}</span>
                <span className="text-sm font-medium text-slate-300">Availability</span>
              </div>
              <Badge className={`ml-6 ${getStatusColor(billboard.status)}`}>
                {billboard.status === "available" && "Available"}
                {billboard.status === "occupied" && "Currently Occupied"}
                {billboard.status === "maintenance" && "Under Maintenance"}
              </Badge>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Dimensions</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{billboard.dimensions}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Resolution</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{billboard.resolution}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Loop Time</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{billboard.loop_time}s</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Impressions</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{billboard.impressions?.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Pricing</span>
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Cost per play</span>
                  <span className="text-lg font-bold text-green-400">₹{billboard.cost_per_play}</span>
                </div>
                <div className="text-xs text-slate-500">Avg. cost per 120-second ad play</div>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Operating Hours</span>
              </div>
              <p className="text-sm text-slate-400 ml-6">
                {billboard.start_hour}:00 - {billboard.end_hour}:00
              </p>
            </div>

            {/* Description */}
            {billboard.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
                <p className="text-sm text-slate-400">{billboard.description}</p>
              </div>
            )}

            <div className="pb-20"></div>
          </div>
        </div>

        {isAuthenticated && billboard.status === "available" && (
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={() => onToggleSelection(billboard.id)}
              className={`w-full rounded-full shadow-lg ${
                isSelected ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isSelected ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Selection
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Selection
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
