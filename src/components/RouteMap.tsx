"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ScoredRoute, StopResult } from "@/lib/api";
import { useRoutePolyline } from "@/hooks/useRoutePolyline";

interface Props {
  origin: StopResult | null;
  destination: StopResult | null;
  selectedRoute?: ScoredRoute | null;
}

export function RouteMap({ origin, destination, selectedRoute }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const geojson = useRoutePolyline(selectedRoute ?? null, origin, destination);

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

    map.on("load", () => {
      map.addSource("route-polyline", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-trip",
        type: "line",
        source: "route-polyline",
        filter: ["==", ["get", "kind"], "trip"],
        paint: {
          "line-color": ["match", ["get", "riskLabel"],
            "High", "#dc2626", "Medium", "#d97706", "#16a34a"],
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "route-walk",
        type: "line",
        source: "route-polyline",
        filter: ["==", ["get", "kind"], "walk"],
        paint: {
          "line-color": "#6b7280",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update polyline source when GeoJSON changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const source = map.getSource("route-polyline") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(geojson ?? { type: "FeatureCollection", features: [] });
  }, [geojson, mapLoaded]);

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
