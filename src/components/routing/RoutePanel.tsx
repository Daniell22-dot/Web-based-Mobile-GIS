"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Plus, Trash2, Route, Clock, Ruler, Zap } from "lucide-react";
import type { MapMarker, RouteData } from "@/components/map/MapComponent";

interface RoutePanelProps {
  onMarkersChange: (markers: MapMarker[]) => void;
  onRoutesChange: (routes: RouteData[]) => void;
  onSelectingPoint: (type: "origin" | "destination" | "waypoint" | null) => void;
  selectingPoint: "origin" | "destination" | "waypoint" | null;
  pendingClick: { lat: number; lng: number } | null;
}

interface RoutePoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: "origin" | "destination" | "waypoint";
}

// Simulated OSRM-style routing using straight-line + slight deviation
function generateSimulatedRoute(
  from: [number, number],
  to: [number, number],
  waypoints: [number, number][] = []
): RouteData {
  const allPoints = [from, ...waypoints, to];
  const coordinates: [number, number][] = [];

  for (let i = 0; i < allPoints.length - 1; i++) {
    const start = allPoints[i];
    const end = allPoints[i + 1];
    const steps = 20;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      // Add slight road-like deviation
      const deviation = Math.sin(t * Math.PI) * 0.002 * (Math.random() - 0.5);
      coordinates.push([lat + deviation, lng + deviation]);
    }
  }

  // Calculate approximate distance (Haversine)
  let totalDistance = 0;
  for (let i = 0; i < allPoints.length - 1; i++) {
    totalDistance += haversineDistance(allPoints[i], allPoints[i + 1]);
  }

  const avgSpeedKmh = 40; // Mumias urban average
  const duration = (totalDistance / 1000 / avgSpeedKmh) * 3600;

  return { coordinates, distance: totalDistance, duration };
}

function haversineDistance(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Mumias area POI presets
const MUMIAS_PRESETS = [
  { label: "Mumias Town Centre", lat: 0.3667, lng: 34.4833 },
  { label: "Mumias Sugar Factory", lat: 0.3720, lng: 34.4900 },
  { label: "Mumias District Hospital", lat: 0.3650, lng: 34.4780 },
  { label: "Mumias Market", lat: 0.3680, lng: 34.4820 },
  { label: "Kakamega (via A1)", lat: 0.2827, lng: 34.7519 },
  { label: "Busia Border", lat: 0.4608, lng: 34.0900 },
  { label: "Kisumu City", lat: -0.1022, lng: 34.7617 },
  { label: "Webuye Town", lat: 0.6167, lng: 34.7667 },
];

export default function RoutePanel({
  onMarkersChange,
  onRoutesChange,
  onSelectingPoint,
  selectingPoint,
  pendingClick,
}: RoutePanelProps) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [routeMode, setRouteMode] = useState<"fastest" | "shortest" | "scenic">("fastest");

  // Sync markers to parent whenever points change — avoids calling parent setter inside state updater
  useEffect(() => {
    const markers: MapMarker[] = points.map((p) => ({
      id: p.id,
      position: [p.lat, p.lng],
      label: p.label,
      type: p.type,
    }));
    onMarkersChange(markers);
  }, [points, onMarkersChange]);

  const sortPoints = (pts: RoutePoint[]): RoutePoint[] =>
    [...pts].sort((a, b) => {
      const order = { origin: 0, waypoint: 1, destination: 2 };
      return order[a.type] - order[b.type];
    });

  const addPresetPoint = (preset: (typeof MUMIAS_PRESETS)[0], type: "origin" | "destination") => {
    const ts = new Date().getTime();
    const newPoint: RoutePoint = {
      id: `${type}-${ts}`,
      label: preset.label,
      lat: preset.lat,
      lng: preset.lng,
      type,
    };
    setPoints((prev) => sortPoints([...prev.filter((p) => p.type !== type), newPoint]));
  };

  const removePoint = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setRouteInfo(null);
    onRoutesChange([]);
  };

  const calculateRoute = async () => {
    const origin = points.find((p) => p.type === "origin");
    const destination = points.find((p) => p.type === "destination");

    if (!origin || !destination) return;

    setIsCalculating(true);

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    const waypointCoords = points
      .filter((p) => p.type === "waypoint")
      .map((p) => [p.lat, p.lng] as [number, number]);

    const mainRoute = generateSimulatedRoute(
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
      waypointCoords
    );

    // Generate alternative routes
    const altRoute1: RouteData = {
      ...generateSimulatedRoute(
        [origin.lat + 0.005, origin.lng + 0.003],
        [destination.lat, destination.lng]
      ),
      color: "#8b5cf6",
    };

    const routes =
      routeMode === "fastest"
        ? [{ ...mainRoute, color: "#3b82f6" }, altRoute1]
        : routeMode === "shortest"
        ? [{ ...mainRoute, distance: mainRoute.distance * 0.9, color: "#10b981" }]
        : [{ ...mainRoute, color: "#f59e0b" }];

    onRoutesChange(routes);
    setRouteInfo({ distance: mainRoute.distance, duration: mainRoute.duration });
    setIsCalculating(false);
  };

  // Handle pending map click — confirm point from map
  const handleAddFromMap = (type: "origin" | "destination" | "waypoint") => {
    if (!pendingClick) return;
    const newPoint: RoutePoint = {
      id: `${type}-${Date.now()}`,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} (${pendingClick.lat.toFixed(4)}, ${pendingClick.lng.toFixed(4)})`,
      lat: pendingClick.lat,
      lng: pendingClick.lng,
      type,
    };
    setPoints((prev) =>
      sortPoints([...(type !== "waypoint" ? prev.filter((p) => p.type !== type) : prev), newPoint])
    );
    onSelectingPoint(null);
  };

  const origin = points.find((p) => p.type === "origin");
  const destination = points.find((p) => p.type === "destination");
  const waypoints = points.filter((p) => p.type === "waypoint");

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Route Mode Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Route Mode
        </label>
        <div className="grid grid-cols-3 gap-1">
          {(["fastest", "shortest", "scenic"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRouteMode(mode)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                routeMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {mode === "fastest" ? "Fastest" : mode === "shortest" ? "Shortest" : "Scenic"}
            </button>
          ))}
        </div>
      </div>

      {/* Origin */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Origin
        </label>
        {origin ? (
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <MapPin size={14} className="text-green-400 shrink-0" />
            <span className="text-sm text-white flex-1 truncate">{origin.label}</span>
            <button onClick={() => removePoint(origin.id)} className="text-slate-400 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <select
              className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              onChange={(e) => {
                const preset = MUMIAS_PRESETS.find((p) => p.label === e.target.value);
                if (preset) addPresetPoint(preset, "origin");
              }}
              value=""
            >
              <option value="">Select from Mumias area...</option>
              {MUMIAS_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSelectingPoint("origin")}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-all ${
                selectingPoint === "origin"
                  ? "bg-green-600 border-green-500 text-white"
                  : "border-slate-600 text-slate-300 hover:border-green-500 hover:text-green-400"
              }`}
            >
              <MapPin size={14} />
              {selectingPoint === "origin" ? "Click on map..." : "Pick on map"}
            </button>
          </div>
        )}
      </div>

      {/* Waypoints */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Waypoints
        </label>
        {waypoints.map((wp) => (
          <div key={wp.id} className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2 mb-1.5">
            <MapPin size={14} className="text-yellow-400 shrink-0" />
            <span className="text-sm text-white flex-1 truncate">{wp.label}</span>
            <button onClick={() => removePoint(wp.id)} className="text-slate-400 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onSelectingPoint("waypoint")}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-all ${
            selectingPoint === "waypoint"
              ? "bg-yellow-600 border-yellow-500 text-white"
              : "border-slate-600 text-slate-300 hover:border-yellow-500 hover:text-yellow-400"
          }`}
        >
          <Plus size={14} />
          {selectingPoint === "waypoint" ? "Click on map..." : "Add waypoint"}
        </button>
      </div>

      {/* Destination */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Destination
        </label>
        {destination ? (
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Navigation size={14} className="text-red-400 shrink-0" />
            <span className="text-sm text-white flex-1 truncate">{destination.label}</span>
            <button onClick={() => removePoint(destination.id)} className="text-slate-400 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <select
              className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              onChange={(e) => {
                const preset = MUMIAS_PRESETS.find((p) => p.label === e.target.value);
                if (preset) addPresetPoint(preset, "destination");
              }}
              value=""
            >
              <option value="">Select from Mumias area...</option>
              {MUMIAS_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSelectingPoint("destination")}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-all ${
                selectingPoint === "destination"
                  ? "bg-red-600 border-red-500 text-white"
                  : "border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400"
              }`}
            >
              <Navigation size={14} />
              {selectingPoint === "destination" ? "Click on map..." : "Pick on map"}
            </button>
          </div>
        )}
      </div>

      {/* Map click pending */}
      {selectingPoint && pendingClick && (
        <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
          <p className="text-xs text-blue-300 mb-2">
            Selected: {pendingClick.lat.toFixed(4)}, {pendingClick.lng.toFixed(4)}
          </p>
          <button
            onClick={() => handleAddFromMap(selectingPoint)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-1.5 rounded-lg transition-colors"
          >
            Confirm as {selectingPoint}
          </button>
        </div>
      )}

      {/* Calculate Button */}
      <button
        onClick={calculateRoute}
        disabled={!origin || !destination || isCalculating}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all"
      >
        {isCalculating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Route size={16} />
            Calculate Route
          </>
        )}
      </button>

      {/* Route Results */}
      {routeInfo && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Optimal Route Found</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <Ruler size={16} className="text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {(routeInfo.distance / 1000).toFixed(1)} km
              </div>
              <div className="text-xs text-slate-400">Distance</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <Clock size={16} className="text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {Math.round(routeInfo.duration / 60)} min
              </div>
              <div className="text-xs text-slate-400">Est. Time</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 text-center">
            Blue = Primary · Purple = Alternative
          </div>
        </div>
      )}

      {/* Clear All */}
      {points.length > 0 && (
        <button
          onClick={() => {
            setPoints([]);
            onRoutesChange([]);
            setRouteInfo(null);
          }}
          className="w-full py-2 text-sm text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 rounded-lg transition-all"
        >
          Clear All Points
        </button>
      )}
    </div>
  );
}
