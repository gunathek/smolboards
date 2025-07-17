import { Card, CardContent } from "@/components/ui/card"
import { Eye, MapPin } from "lucide-react"

interface MapStatsProps {
  visibleCount: number
  totalCount: number
}

export function MapStats({ visibleCount, totalCount }: MapStatsProps) {
  return (
    <Card className="p-0 shadow-lg border-gray-200 bg-white text-gray-800 map-stats">
      <CardContent className="p-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">{visibleCount}</span>
          <span className="text-gray-600">In View</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">{totalCount}</span>
          <span className="text-gray-600">Total</span>
        </div>
      </CardContent>
    </Card>
  )
}
