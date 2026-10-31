"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Car, Clock, TrendingUp, CheckCircle } from "lucide-react";
import type { TrafficOverlayData } from "@/components/map/MapComponent";

interface TrafficPanelProps {
  onTrafficUpdate: (data: TrafficOverlayData | null) => void;
  enabled: boolean;
}

// Mumias area road network simulation
const MUMIAS_ROADS = [
  "A1 Highway (Mumias-Kakamega)",
  "B8 Road (Mumias-Busia)",
  "Mumias-Butere Road",
  "Mumias Town Centre",
  "Sugar Factory Access Road",
  "Mumias-Webuye Road",
];

const INCIDENT_TYPES = [
  "Road Works",
  "Accident",
  "Flooding",
  "Market Congestion",
  "School Zone",
  "Broken Down Vehicle",
  "Police Checkpoint",
];

function generateTrafficData(): TrafficOverlayData {
  const levels: TrafficOverlayData["congestionLevel"][] = ["low", "moderate", "high", "severe"];
  const weights = [0.4, 0.35, 0.2, 0.05]; // Probability weights
  const rand = Math.random();
  let cumulative = 0;
  let congestionLevel: TrafficOverlayData["congestionLevel"] = "low";
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      congestionLevel = levels[i];
      break;
    }
  }

  const speedByLevel = { low: 45, moderate: 30, high: 18, severe: 8 };
  const incidentCount = Math.floor(Math.random() * 4);

  const incidents = Array.from({ length: incidentCount }, (_, i) => ({
    id: `inc-${i}`,
    position: [
      0.3667 + (Math.random() - 0.5) * 0.08,
      34.4833 + (Math.random() - 0.5) * 0.08,
    ] as [number, number],
    type: INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)],
    description: `${MUMIAS_ROADS[Math.floor(Math.random() * MUMIAS_ROADS.length)]} - ${
      ["Expect delays", "Use alternate route", "Slow moving traffic", "Lane closure"][
        Math.floor(Math.random() * 4)
      ]
    }`,
    severity: (["minor", "moderate", "major"] as const)[Math.floor(Math.random() * 3)],
  }));

  return {
    congestionLevel,
    incidents,
    averageSpeed: speedByLevel[congestionLevel] + Math.round((Math.random() - 0.5) * 10),
  };
}

interface RoadStatus {
  road: string;
  status: "clear" | "slow" | "congested" | "blocked";
  speed: number;
  delay: number;
}

function generateRoadStatuses(): RoadStatus[] {
  const statuses: RoadStatus["status"][] = ["clear", "slow", "congested", "blocked"];
  return MUMIAS_ROADS.map((road) => {
    const status = statuses[Math.floor(Math.random() * statuses.length * 0.8)]; // Bias toward clear
    const speedMap = { clear: 50, slow: 25, congested: 12, blocked: 0 };
    return {
      road,
      status: status || "clear",
      speed: speedMap[status || "clear"] + Math.round((Math.random() - 0.5) * 8),
      delay: status === "clear" ? 0 : Math.round(Math.random() * 15),
    };
  });
}

export default function TrafficPanel({ onTrafficUpdate, enabled }: TrafficPanelProps) {
  const [traffic, setTraffic] = useState<TrafficOverlayData | null>(null);
  const [roadStatuses, setRoadStatuses] = useState<RoadStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTraffic = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const data = generateTrafficData();
    const roads = generateRoadStatuses();
    setTraffic(data);
    setRoadStatuses(roads);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTraffic();
    const interval = setInterval(() => void fetchTraffic(), 300000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchTraffic]);

  // Always push traffic data to parent; parent decides whether to show overlay
  useEffect(() => {
    if (traffic) {
      onTrafficUpdate(enabled ? traffic : null);
    }
  }, [enabled, traffic, onTrafficUpdate]);

  const congestionConfig = {
    low: { color: "bg-green-500", text: "text-green-400", label: "Light Traffic", bar: "w-1/4" },
    moderate: { color: "bg-yellow-500", text: "text-yellow-400", label: "Moderate Traffic", bar: "w-2/4" },
    high: { color: "bg-orange-500", text: "text-orange-400", label: "Heavy Traffic", bar: "w-3/4" },
    severe: { color: "bg-red-500", text: "text-red-400", label: "Severe Congestion", bar: "w-full" },
  };

  const statusConfig = {
    clear: { color: "bg-green-500", text: "text-green-400", label: "Clear" },
    slow: { color: "bg-yellow-500", text: "text-yellow-400", label: "Slow" },
    congested: { color: "bg-orange-500", text: "text-orange-400", label: "Congested" },
    blocked: { color: "bg-red-500", text: "text-red-400", label: "Blocked" },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Live Traffic</h3>
          {lastUpdated && (
            <p className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
        <button
          onClick={fetchTraffic}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !traffic ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : traffic ? (
        <>
          {/* Overall Congestion */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Car size={16} className={congestionConfig[traffic.congestionLevel].text} />
                <span className={`text-sm font-semibold ${congestionConfig[traffic.congestionLevel].text}`}>
                  {congestionConfig[traffic.congestionLevel].label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-slate-400" />
                <span className="text-sm font-bold text-white">{traffic.averageSpeed} km/h</span>
              </div>
            </div>

            {/* Congestion Bar */}
            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full ${congestionConfig[traffic.congestionLevel].color} ${
                  congestionConfig[traffic.congestionLevel].bar
                } transition-all duration-500 rounded-full`}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Free flow</span>
              <span>Standstill</span>
            </div>
          </div>

          {/* Active Incidents */}
          {traffic.incidents.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle size={12} className="text-orange-400" />
                Active Incidents ({traffic.incidents.length})
              </label>
              <div className="space-y-2">
                {traffic.incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`rounded-lg p-3 border text-sm ${
                      incident.severity === "major"
                        ? "bg-red-900/30 border-red-700/50"
                        : incident.severity === "moderate"
                        ? "bg-orange-900/30 border-orange-700/50"
                        : "bg-yellow-900/30 border-yellow-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{incident.type}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          incident.severity === "major"
                            ? "bg-red-800 text-red-300"
                            : incident.severity === "moderate"
                            ? "bg-orange-800 text-orange-300"
                            : "bg-yellow-800 text-yellow-300"
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{incident.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {incident.position[0].toFixed(4)}N, {incident.position[1].toFixed(4)}E
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {traffic.incidents.length === 0 && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-sm">
                <CheckCircle size={14} />
                No Active Incidents
              </div>
              <div className="text-xs text-slate-400 mt-1">Roads are clear in the Mumias area</div>
            </div>
          )}

          {/* Road Status Table */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Road Status
            </label>
            <div className="space-y-1.5">
              {roadStatuses.map((road) => (
                <div
                  key={road.road}
                  className="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig[road.status].color}`} />
                  <span className="text-xs text-slate-300 flex-1 truncate">{road.road}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {road.delay > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-orange-400">
                        <Clock size={10} />
                        +{road.delay}m
                      </span>
                    )}
                    <span className={`text-xs font-medium ${statusConfig[road.status].text}`}>
                      {road.status === "blocked" ? "Blocked" : `${road.speed} km/h`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overlay Toggle Info */}
          <div className="text-xs text-slate-500 text-center">
            {enabled ? (
              <span className="text-blue-400">Traffic incidents shown on map</span>
            ) : (
              <span>Toggle traffic overlay in the toolbar above</span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
