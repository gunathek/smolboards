"use client"

import { useEffect, useRef, useState } from "react"
import type { Billboard } from "@/lib/supabase"

interface MapComponentProps {
  center: [number, number]
  zoom: number
  billboards: Billboard[]
  selectedBillboard: Billboard | null
  selectedBillboards: Set<string>
  onBoundsChange: (bounds: [[number, number], [number, number]]) => void
}

export default function MapComponent({
  center,
  zoom,
  billboards,
  selectedBillboard,
  selectedBillboards,
  onBoundsChange,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerClusterGroupRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  /* -------------------------------------------------------------------------------------------------
   * Helpers
   * -----------------------------------------------------------------------------------------------*/

  // Pretty circular icon
  const createBillboardIcon = (billboard: Billboard, isSelected = false) => {
    const isSelectedForPurchase = selectedBillboards.has(billboard.id)
    const colors = {
      available: isSelected ? "#10b981" : isSelectedForPurchase ? "#059669" : "#22c55e",
      occupied: isSelected ? "#dc2626" : "#ef4444",
      maintenance: isSelected ? "#d97706" : "#f59e0b",
    } as const

    const size = isSelected ? 38 : isSelectedForPurchase ? 36 : 32
    const borderColor = isSelectedForPurchase ? "#ffffff" : "white"
    const borderWidth = isSelectedForPurchase ? 4 : 3

    return leafletRef.current.divIcon({
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${colors[billboard.status as keyof typeof colors]};
          border:${borderWidth}px solid ${borderColor};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 8px rgba(0,0,0,.3);
          font-size:${size * 0.4}px;
          position:relative;
        ">
          ${isSelectedForPurchase ? "✓" : billboard.status === "available" ? "📍" : billboard.status === "occupied" ? "🚫" : "🔧"}
        </div>`,
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

    billboards.forEach((b) => {
      const marker = L.marker([b.lat, b.lng], {
        icon: createBillboardIcon(b, selectedBillboard?.id === b.id),
      })

      marker.on("click", () => {
        window.parent.postMessage({ type: "selectBillboard", billboardId: b.id }, "*")
      })

      markerClusterGroupRef.current.addLayer(marker)
    })
    markerClusterGroupRef.current.refreshClusters()
  }

  // refresh markers whenever billboards / selection change OR once map is ready
  useEffect(refreshMarkers, [billboards, selectedBillboard, selectedBillboards, mapReady])

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
