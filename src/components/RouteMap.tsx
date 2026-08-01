"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ScoredRoute, StopResult } from "@/lib/api";
import { stopBounds } from "@/lib/mapBounds";
import { useRoutePolyline } from "@/hooks/useRoutePolyline";
import { routeSummary } from "@/lib/routeSummary";
import { MAP_FRAME_CLASS } from "./MapFrame";

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
  const [loadFailed, setLoadFailed] = useState(false);

  const geojson = useRoutePolyline(selectedRoute ?? null);

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

    // Read inside the error handler, which closes over the initial state
    let loaded = false;
    map.on("error", (e) => {
      console.error("maplibre error", e?.error ?? e);
      // Errors raised before the style loads mean the basemap never
      // arrived; later ones are individual tile misses that self-heal
      if (!loaded) setLoadFailed(true);
    });

    map.on("load", () => {
      loaded = true;
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
      setLoadFailed(false);
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
      map.fitBounds(stopBounds(origin, destination), { padding: 80, maxZoom: 13 });
    } else if (origin) {
      map.flyTo({ center: [origin.lon, origin.lat], zoom: 12 });
    } else if (destination) {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 12 });
    }
  }, [origin, destination]);

  return (
    <div
      data-testid="route-map"
      role="region"
      aria-label="Route map"
      className={MAP_FRAME_CLASS}
    >
      {/* The canvas conveys the route visually only */}
      <p className="sr-only">
        {selectedRoute ? routeSummary(selectedRoute) : "No route selected."}
      </p>
      <div ref={containerRef} className="h-full w-full" />
      {loadFailed && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-n-50 px-6 text-center"
        >
          <p className="text-sm font-medium text-n-700">Map unavailable</p>
          <p className="text-xs text-n-500">
            The basemap could not be loaded. Route details are still listed above.
          </p>
        </div>
      )}
    </div>
  );
}
