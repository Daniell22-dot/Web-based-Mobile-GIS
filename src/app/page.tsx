"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import {
  Map,
  Route,
  Cloud,
  Car,
  Bot,
  Menu,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { MapMarker, RouteData, WeatherOverlayData, TrafficOverlayData } from "@/components/map/MapComponent";
import RoutePanel from "@/components/routing/RoutePanel";
import WeatherPanel from "@/components/weather/WeatherPanel";
import TrafficPanel from "@/components/traffic/TrafficPanel";
import AIAssistant from "@/components/ai/AIAssistant";

// Dynamic import for map (SSR disabled — Leaflet requires browser)
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading map...</p>
        <p className="text-slate-600 text-xs mt-1">Mumias, Kenya</p>
      </div>
    </div>
  ),
});

type ActivePanel = "route" | "weather" | "traffic" | "ai" | null;

export default function GISPage() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("route");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherOverlayData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficOverlayData | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<"origin" | "destination" | "waypoint" | null>(null);
  const [pendingClick, setPendingClick] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (selectingPoint) {
        setPendingClick({ lat, lng });
      }
    },
    [selectingPoint]
  );

  const handleWeatherUpdate = useCallback((data: WeatherOverlayData | null) => {
    setWeatherData(data);
  }, []);

  const handleTrafficUpdate = useCallback((data: TrafficOverlayData | null) => {
    setTrafficData(data);
  }, []);

  const navItems = [
    { id: "route" as ActivePanel, icon: Route, label: "Routes", color: "text-blue-400" },
    { id: "weather" as ActivePanel, icon: Cloud, label: "Weather", color: "text-cyan-400" },
    { id: "traffic" as ActivePanel, icon: Car, label: "Traffic", color: "text-orange-400" },
    { id: "ai" as ActivePanel, icon: Bot, label: "AI Chat", color: "text-purple-400" },
  ];

  const currentWeatherStr = weatherData
    ? `${weatherData.condition}, ${weatherData.temperature}°C`
    : "";
  const currentTrafficStr = trafficData
    ? `${trafficData.congestionLevel} traffic, avg ${trafficData.averageSpeed} km/h`
    : "";

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">MumiasGIS</h1>
              <p className="text-xs text-slate-400 leading-tight hidden sm:block">
                AI-Powered Mobile GIS · Mumias, Kenya
              </p>
            </div>
          </div>
        </div>

        {/* Overlay Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeatherOverlay((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showWeatherOverlay
                ? "bg-cyan-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Cloud size={13} />
            <span className="hidden sm:inline">Weather</span>
          </button>
          <button
            onClick={() => setShowTrafficOverlay((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTrafficOverlay
                ? "bg-orange-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Car size={13} />
            <span className="hidden sm:inline">Traffic</span>
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          >
            <Layers size={13} />
            <span>Panels</span>
          </button>
        </div>

        {/* Coordinates display */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>0.3667°N, 34.4833°E</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Desktop */}
        <aside
          className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
            sidebarOpen ? "w-72" : "w-0 overflow-hidden"
          }`}
        >
          {/* Panel Navigation */}
          <div className="flex border-b border-slate-800 shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePanel(activePanel === item.id ? null : item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                  activePanel === item.id
                    ? `${item.color} border-b-2 border-current bg-slate-800/50`
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === "route" && (
              <RoutePanel
                onMarkersChange={setMarkers}
                onRoutesChange={setRoutes}
                onSelectingPoint={setSelectingPoint}
                selectingPoint={selectingPoint}
                pendingClick={pendingClick}
              />
            )}
            {activePanel === "weather" && (
              <WeatherPanel
                onWeatherUpdate={handleWeatherUpdate}
                enabled={showWeatherOverlay}
              />
            )}
            {activePanel === "traffic" && (
              <TrafficPanel
                onTrafficUpdate={handleTrafficUpdate}
                enabled={showTrafficOverlay}
              />
            )}
            {activePanel === "ai" && (
              <AIAssistant
                currentWeather={currentWeatherStr}
                currentTraffic={currentTrafficStr}
              />
            )}
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute left-72 top-1/2 -translate-y-1/2 w-5 h-10 bg-slate-800 border border-slate-700 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
          >
            <ChevronLeft size={12} />
          </button>
        </aside>

        {/* Sidebar Expand Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-slate-800 border border-slate-700 rounded-r-lg items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
          >
            <ChevronRight size={12} />
          </button>
        )}

        {/* Map Area */}
        <main className="flex-1 relative overflow-hidden">
          {/* Selecting point indicator */}
          {selectingPoint && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              Click on the map to set {selectingPoint}
            </div>
          )}

          <MapComponent
            markers={markers}
            routes={routes}
            showTraffic={showTrafficOverlay}
            showWeather={showWeatherOverlay}
            weatherData={weatherData}
            trafficData={trafficData}
            onMapClick={handleMapClick}
          />
        </main>

        {/* Right AI Panel — Desktop */}
        {activePanel === "ai" && sidebarOpen && (
          <aside className="hidden lg:flex flex-col w-80 bg-slate-900 border-l border-slate-800">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 shrink-0">
              <Bot size={16} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">AI GIS Assistant</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <AIAssistant
                currentWeather={currentWeatherStr}
                currentTraffic={currentTrafficStr}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex border-t border-slate-800 bg-slate-900 shrink-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActivePanel(activePanel === item.id ? null : item.id);
              setMobileMenuOpen(activePanel !== item.id);
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
              activePanel === item.id
                ? `${item.color}`
                : "text-slate-500"
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Panel Drawer */}
      {mobileMenuOpen && activePanel && (
        <div className="md:hidden absolute inset-0 z-40 flex flex-col">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="font-semibold text-white capitalize">
                {navItems.find((n) => n.id === activePanel)?.label}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              {activePanel === "route" && (
                <RoutePanel
                  onMarkersChange={setMarkers}
                  onRoutesChange={setRoutes}
                  onSelectingPoint={(type) => {
                    setSelectingPoint(type);
                    if (type) setMobileMenuOpen(false);
                  }}
                  selectingPoint={selectingPoint}
                  pendingClick={pendingClick}
                />
              )}
              {activePanel === "weather" && (
                <WeatherPanel
                  onWeatherUpdate={handleWeatherUpdate}
                  enabled={showWeatherOverlay}
                />
              )}
              {activePanel === "traffic" && (
                <TrafficPanel
                  onTrafficUpdate={handleTrafficUpdate}
                  enabled={showTrafficOverlay}
                />
              )}
              {activePanel === "ai" && (
                <div className="h-[50vh]">
                  <AIAssistant
                    currentWeather={currentWeatherStr}
                    currentTraffic={currentTrafficStr}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
