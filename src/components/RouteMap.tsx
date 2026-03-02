"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StopResult } from "@/lib/api";

interface Props {
  origin: StopResult | null;
  destination: StopResult | null;
}

export function RouteMap({ origin, destination }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialise map on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-79.8, 43.6],
      zoom: 9,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // React to origin/destination changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (origin) {
      const marker = new maplibregl.Marker({ color: "#16a34a" })
        .setLngLat([origin.lon, origin.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (destination) {
      const marker = new maplibregl.Marker({ color: "#dc2626" })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (origin && destination) {
      map.fitBounds(
        [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat],
        ],
        { padding: 80, maxZoom: 13 }
      );
    } else if (origin) {
      map.flyTo({ center: [origin.lon, origin.lat], zoom: 12 });
    } else if (destination) {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 12 });
    }
  }, [origin, destination]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ height: "480px" }}
    />
  );
}
