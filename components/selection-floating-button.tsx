"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SelectionFloatingButtonProps {
  selectedCount: number
  onViewSelection: () => void
}

export function SelectionFloatingButton({ selectedCount, onViewSelection }: SelectionFloatingButtonProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1000]">
      <Button
        onClick={onViewSelection}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 text-sm font-medium"
        disabled={selectedCount === 0}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span>Selected Boards ({selectedCount})</span>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">{selectedCount}</div>
      </Button>
    </div>
  )
}
