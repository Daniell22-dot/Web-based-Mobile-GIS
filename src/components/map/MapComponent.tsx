"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Thermometer, Droplets, Wind, Eye } from "lucide-react";

// Mumias, Kenya coordinates
const MUMIAS_CENTER: [number, number] = [0.3667, 34.4833];
const DEFAULT_ZOOM = 13;

export interface MapMarker {
  id: string;
  position: [number, number];
  label: string;
  type: "origin" | "destination" | "waypoint" | "poi";
}

export interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  color?: string;
}

interface MapComponentProps {
  markers?: MapMarker[];
  routes?: RouteData[];
  showTraffic?: boolean;
  showWeather?: boolean;
  weatherData?: WeatherOverlayData | null;
  trafficData?: TrafficOverlayData | null;
  onMapClick?: (lat: number, lng: number) => void;
}

export interface WeatherOverlayData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  icon: string;
}

export interface TrafficOverlayData {
  congestionLevel: "low" | "moderate" | "high" | "severe";
  incidents: TrafficIncident[];
  averageSpeed: number;
}

export interface TrafficIncident {
  id: string;
  position: [number, number];
  type: string;
  description: string;
  severity: "minor" | "moderate" | "major";
}

type BasemapId = "osm" | "carto-dark" | "google-satellite" | "google-terrain";

interface BasemapOption {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const BASEMAPS: BasemapOption[] = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: "carto-dark",
    label: "Carto Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  {
    id: "google-satellite",
    label: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    maxZoom: 20,
  },
  {
    id: "google-terrain",
    label: "Google Terrain",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    maxZoom: 20,
  },
];

export default function MapComponent({
  markers = [],
  routes = [],
  showTraffic = false,
  showWeather = false,
  weatherData = null,
  trafficData = null,
  onMapClick,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const markerLayersRef = useRef<L.Marker[]>([]);
  const trafficLayersRef = useRef<L.CircleMarker[]>([]);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("carto-dark");
  const [showBasemapPicker, setShowBasemapPicker] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix Leaflet default icon issue in Next.js
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      center: MUMIAS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    // Default basemap — Carto Dark
    const defaultBasemap = BASEMAPS.find((b) => b.id === "carto-dark")!;
    const tileLayer = L.tileLayer(defaultBasemap.url, {
      attribution: defaultBasemap.attribution,
      maxZoom: defaultBasemap.maxZoom,
      subdomains: "abcd",
    }).addTo(map);

    baseTileRef.current = tileLayer;

    // Click handler
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;

    const timer = setTimeout(() => setMapReady(true), 0);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      baseTileRef.current = null;
    };
  }, [onMapClick]);

  // Switch basemap
  const switchBasemap = useCallback((id: BasemapId) => {
    if (!mapRef.current) return;
    const config = BASEMAPS.find((b) => b.id === id);
    if (!config) return;

    if (baseTileRef.current) {
      mapRef.current.removeLayer(baseTileRef.current);
    }

    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.id === "carto-dark" ? "abcd" : "abc",
    });

    // Add below other layers by inserting at the bottom
    newTile.addTo(mapRef.current);
    newTile.bringToBack();
    baseTileRef.current = newTile;
    setActiveBasemap(id);
    setShowBasemapPicker(false);
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    markerLayersRef.current.forEach((m) => m.remove());
    markerLayersRef.current = [];

    markers.forEach((marker) => {
      const iconColors: Record<MapMarker["type"], string> = {
        origin: "#22c55e",
        destination: "#ef4444",
        waypoint: "#f59e0b",
        poi: "#3b82f6",
      };

      const color = iconColors[marker.type];
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>
      `;

      const icon = L.divIcon({
        html: svgIcon,
        className: "",
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36],
      });

      const leafletMarker = L.marker(marker.position, { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<strong>${marker.label}</strong><br/><small>${marker.type}</small>`);

      markerLayersRef.current.push(leafletMarker);
    });
  }, [markers, mapReady]);

  // Update routes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    routeLayersRef.current.forEach((r) => r.remove());
    routeLayersRef.current = [];

    routes.forEach((route, index) => {
      const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
      const color = route.color || colors[index % colors.length];

      const polyline = L.polyline(route.coordinates, {
        color,
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(mapRef.current!);

      polyline.bindPopup(
        `<strong>Route ${index + 1}</strong><br/>
        Distance: ${(route.distance / 1000).toFixed(1)} km<br/>
        Duration: ${Math.round(route.duration / 60)} min`
      );

      routeLayersRef.current.push(polyline);
    });

    // Fit bounds to routes if any
    if (routes.length > 0 && routes[0].coordinates.length > 0) {
      const allCoords = routes.flatMap((r) => r.coordinates);
      const bounds = L.latLngBounds(allCoords);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes, mapReady]);

  // Update traffic overlay
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    trafficLayersRef.current.forEach((t) => t.remove());
    trafficLayersRef.current = [];

    if (showTraffic && trafficData) {
      trafficData.incidents.forEach((incident) => {
        const severityColors = {
          minor: "#f59e0b",
          moderate: "#f97316",
          major: "#ef4444",
        };

        const circle = L.circleMarker(incident.position, {
          radius: 10,
          fillColor: severityColors[incident.severity],
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(mapRef.current!)
          .bindPopup(
            `<strong>${incident.type}</strong><br/>${incident.description}<br/><small>Severity: ${incident.severity}</small>`
          );

        trafficLayersRef.current.push(circle);
      });
    }
  }, [showTraffic, trafficData, mapReady]);

  const congestionDotClass =
    trafficData?.congestionLevel === "low"
      ? "bg-green-400"
      : trafficData?.congestionLevel === "moderate"
      ? "bg-yellow-400"
      : trafficData?.congestionLevel === "high"
      ? "bg-orange-400"
      : "bg-red-500";

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Basemap Switcher */}
      <div className="absolute bottom-8 right-3 z-[1000]">
        <button
          onClick={() => setShowBasemapPicker((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors shadow-lg"
          title="Switch basemap"
        >
          <Layers size={13} />
          <span>{BASEMAPS.find((b) => b.id === activeBasemap)?.label}</span>
        </button>

        {showBasemapPicker && (
          <div className="absolute bottom-full mb-2 right-0 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            {BASEMAPS.map((bm) => (
              <button
                key={bm.id}
                onClick={() => switchBasemap(bm.id)}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                  activeBasemap === bm.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {bm.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Weather overlay badge */}
      {showWeather && weatherData && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white rounded-xl p-3 shadow-lg border border-slate-700 z-[1000] min-w-[170px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
            <div className="text-xs text-slate-300 leading-tight">
              <div className="font-medium">{weatherData.condition}</div>
              <div className="text-slate-400">Mumias</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5">
              <Droplets size={11} className="text-blue-400" />
              <span>Humidity: {weatherData.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind size={11} className="text-cyan-400" />
              <span>Wind: {weatherData.windSpeed} km/h {weatherData.windDirection}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye size={11} className="text-purple-400" />
              <span>Visibility: {weatherData.visibility} km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer size={11} className="text-orange-400" />
              <span>Feels like: {weatherData.temperature + Math.round(weatherData.humidity / 20 - 2)}°C</span>
            </div>
          </div>
        </div>
      )}

      {/* Traffic status badge */}
      {showTraffic && trafficData && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white rounded-xl px-4 py-2 shadow-lg border border-slate-700 z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${congestionDotClass}`} />
            <span className="font-medium capitalize">Traffic: {trafficData.congestionLevel}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Avg {trafficData.averageSpeed} km/h</span>
            {trafficData.incidents.length > 0 && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-orange-400">{trafficData.incidents.length} incident{trafficData.incidents.length > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map attribution overlay */}
      <div className="absolute bottom-2 left-2 text-xs text-slate-500 z-[1000] bg-white/80 px-1 rounded">
        Mumias, Kenya · {MUMIAS_CENTER[0]}N, {MUMIAS_CENTER[1]}E
      </div>
    </div>
  );
}
