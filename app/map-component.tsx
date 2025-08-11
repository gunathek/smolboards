"use client"

import { useEffect, useRef, useState } from "react"
import type { Billboard } from "@/lib/supabase"
import type { BillboardFilters } from "@/components/billboard-sidebar"

interface MapComponentProps {
  center: [number, number]
  zoom: number
  billboards: Billboard[]
  selectedBillboard: Billboard | null
  onBoundsChange: (bounds: [[number, number], [number, number]]) => void
  filters: BillboardFilters
}

export default function MapComponent({
  center,
  zoom,
  billboards,
  selectedBillboard,
  onBoundsChange,
  filters,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerClusterGroupRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  /* -------------------------------------------------------------------------------------------------
   * Helpers
   * -----------------------------------------------------------------------------------------------*/

  // Apply sidebar filters
  const getFilteredBillboards = () => {
    let filtered = billboards

    if (filters.category !== "all") {
      filtered = filtered.filter((b) => b.category === filters.category)
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((b) => b.status === filters.status)
    }

    filtered = filtered.filter((b) => b.daily_rate >= filters.minRate && b.daily_rate <= filters.maxRate)

    return filtered
  }

  // Pretty circular icon
  const createBillboardIcon = (status: string, isSelected = false) => {
    const colors = {
      available: isSelected ? "#10b981" : "#22c55e",
      occupied: isSelected ? "#dc2626" : "#ef4444",
      maintenance: isSelected ? "#d97706" : "#f59e0b",
    } as const

    const size = isSelected ? 38 : 32
    return leafletRef.current.divIcon({
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${colors[status as keyof typeof colors]};
          border:3px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 8px rgba(0,0,0,.3);
          font-size:${size * 0.55}px
        ">📍</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      className: "billboard-pin",
    })
  }

  /* -------------------------------------------------------------------------------------------------
   * Initialise Leaflet map
   * -----------------------------------------------------------------------------------------------*/
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || typeof window === "undefined") return
      const L = (await import("leaflet")).default
      await import("leaflet.markercluster")
      leafletRef.current = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView(center, zoom)

        // Replace the existing tile layer with CartoDB Voyager
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)

        // cluster group
        markerClusterGroupRef.current = L.markerClusterGroup({
          maxClusterRadius: 20,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
        })
        mapInstanceRef.current.addLayer(markerClusterGroupRef.current)

        // bounds listener
        mapInstanceRef.current.on("moveend zoomend", () => {
          const b = mapInstanceRef.current.getBounds()
          onBoundsChange([
            [b.getSouthWest().lat, b.getSouthWest().lng],
            [b.getNorthEast().lat, b.getNorthEast().lng],
          ])
        })

        setMapReady(true)
      }
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, []) // only once

  /* -------------------------------------------------------------------------------------------------
   * Add / refresh markers
   * -----------------------------------------------------------------------------------------------*/
  const refreshMarkers = () => {
    if (!mapReady || !markerClusterGroupRef.current) return
    const L = leafletRef.current
    markerClusterGroupRef.current.clearLayers()

    getFilteredBillboards().forEach((b) => {
      const marker = L.marker([b.lat, b.lng], {
        icon: createBillboardIcon(b.status, selectedBillboard?.id === b.id),
      }).bindPopup(popupContent(b))
      marker.on("click", () => {
        // Send message to parent to select this billboard
        window.parent.postMessage({ type: "selectBillboard", billboardId: b.id }, "*")
      })
      markerClusterGroupRef.current.addLayer(marker)
    })
    markerClusterGroupRef.current.refreshClusters()
  }

  // build HTML once without stray quotes / back-slashes
  const popupContent = (b: Billboard) => `
  <div style="
    padding: 16px;
    min-width: 280px;
    max-width: 320px;
    font-family: system-ui, -apple-system, sans-serif;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  ">
    <div style="margin-bottom: 12px;">
      <h3 style="
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: #111827;
        line-height: 1.3;
      ">${b.name}</h3>
      <div style="
        display: inline-block;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
        background: ${b.status === "available" ? "#D1FAE5" : b.status === "occupied" ? "#FECACA" : "#FEF3C7"};
        color: ${b.status === "available" ? "#065F46" : b.status === "occupied" ? "#7F1D1D" : "#92400E"};
      ">${b.status}</div>
    </div>
    
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #374151;
    ">
      <div>
        <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 2px;">DIMENSIONS</div>
        <div style="font-weight: 500;">${b.dimensions}</div>
      </div>
      <div>
        <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 2px;">CATEGORY</div>
        <div style="font-weight: 500;">${b.category}</div>
      </div>
    </div>
    
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #374151;
    ">
      <div>
        <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 2px;">COST PER PLAY</div>
        <div style="font-weight: 700; color: #059669;">₹${b.cost_per_play}</div>
      </div>
      <div>
        <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 2px;">PROVIDER</div>
        <div style="font-weight: 500;">${b.provider}</div>
      </div>
    </div>
    
    <div style="
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #374151;
    ">
      <div>
        <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 2px;">RESOLUTION</div>
        <div style="font-weight: 500;">${b.resolution}</div>
      </div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <div style="font-weight: 600; color: #6B7280; font-size: 12px; margin-bottom: 4px;">ADDRESS</div>
      <div style="font-size: 13px; color: #4B5563; line-height: 1.4;">${b.address}</div>
    </div>
    
    ${
      b.status === "available"
        ? `<button 
            onclick="window.parent.postMessage({type:'openBooking',billboardId:'${b.id}'},'*')"
            style="
              width: 100%;
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
            "
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(5, 150, 105, 0.3)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(5, 150, 105, 0.2)'"
          >📅 Book This Billboard</button>`
        : `<div style="
            width: 100%;
            background: #F3F4F6;
            color: #6B7280;
            border: 1px solid #E5E7EB;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
          ">${b.status === "occupied" ? "🚫 Currently Occupied" : "🔧 Under Maintenance"}</div>`
    }
  </div>
`

  // refresh markers whenever billboards / filters / selection change OR once map is ready
  useEffect(refreshMarkers, [billboards, filters, selectedBillboard, mapReady])

  /* -------------------------------------------------------------------------------------------------
   * Keep map view in sync with props
   * -----------------------------------------------------------------------------------------------*/
  useEffect(() => {
    if (mapReady) mapInstanceRef.current.setView(center, zoom)
  }, [center, zoom, mapReady])

  return (
    <>
      {/* Leaflet styles */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: "100vh" }} />
    </>
  )
}
