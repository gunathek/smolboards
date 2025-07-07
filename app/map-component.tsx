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

    return filtered.filter((b) => b.daily_rate >= filters.minRate && b.daily_rate <= filters.maxRate)
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
          maxClusterRadius: 45,
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
      const marker = L.marker([b.latitude, b.longitude], {
        icon: createBillboardIcon(b.status, selectedBillboard?.id === b.id),
      }).bindPopup(popupContent(b))
      markerClusterGroupRef.current.addLayer(marker)
    })
    markerClusterGroupRef.current.refreshClusters()
  }

  // build HTML once without stray quotes / back-slashes
  const popupContent = (b: Billboard) => `
    <div style="padding:12px;min-width:250px;max-width:300px;">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:#111">${b.name}</h3>
      <div style="font-size:13px;line-height:1.4;color:#444">
        <strong>Dimensions:</strong> ${b.dimensions}<br/>
        <strong>Category:</strong> ${b.category}<br/>
        <strong>Daily:</strong> $${b.daily_rate} &nbsp;
        <strong>Monthly:</strong> $${b.monthly_rate}<br/>
        <strong>Status:</strong>
        <span style="
          padding:2px 6px;
          border-radius:999px;
          background:${b.status === "available" ? "#D1FAE5" : b.status === "occupied" ? "#FECACA" : "#FEF3C7"};
          color:${b.status === "available" ? "#065F46" : b.status === "occupied" ? "#7F1D1D" : "#92400E"};
          font-weight:500;
          text-transform:capitalize;"
        >${b.status}</span><br/>
        <strong>Address:</strong><br/>${b.address}
      </div>
      ${
        b.status === "available"
          ? `<button style="
                margin-top:10px;
                width:100%;
                background:#16a34a;
                color:white;
                border:none;
                padding:8px;
                border-radius:6px;
                cursor:pointer;"
              onclick="window.parent.postMessage({type:'openBooking',billboardId:'${b.id}'},'*')"
            >Book This Billboard</button>`
          : ""
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
