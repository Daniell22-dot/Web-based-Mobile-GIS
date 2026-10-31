"use client";

import { useState, useEffect, useCallback } from "react";
import { Cloud, RefreshCw, Thermometer, Droplets, Wind, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import type { WeatherOverlayData } from "@/components/map/MapComponent";

interface WeatherPanelProps {
  onWeatherUpdate: (data: WeatherOverlayData | null) => void;
  enabled: boolean;
}

// Simulated weather data for Mumias, Kenya region
// In production, integrate with OpenWeatherMap API or similar
function generateMumiasWeather(): WeatherOverlayData {
  const conditions = [
    { condition: "Partly Cloudy", icon: "partly-cloudy", tempRange: [22, 30] },
    { condition: "Sunny", icon: "sunny", tempRange: [25, 34] },
    { condition: "Light Rain", icon: "light-rain", tempRange: [18, 25] },
    { condition: "Overcast", icon: "overcast", tempRange: [20, 27] },
    { condition: "Thunderstorm", icon: "thunderstorm", tempRange: [17, 23] },
    { condition: "Clear Sky", icon: "clear", tempRange: [24, 32] },
  ];

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const selected = conditions[Math.floor(Math.random() * conditions.length)];
  const [min, max] = selected.tempRange;

  return {
    temperature: Math.round(min + Math.random() * (max - min)),
    condition: selected.condition,
    humidity: Math.round(55 + Math.random() * 35),
    windSpeed: Math.round(5 + Math.random() * 25),
    windDirection: directions[Math.floor(Math.random() * directions.length)],
    visibility: Math.round(5 + Math.random() * 15),
    icon: selected.icon,
  };
}

interface HourlyForecast {
  hour: string;
  temp: number;
  condition: string;
  rain: number;
}

function generateHourlyForecast(): HourlyForecast[] {
  const conditions = ["Sunny", "Cloudy", "Rain", "Overcast", "Clear"];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const h = new Date(now.getTime() + i * 3600000);
    return {
      hour: h.getHours().toString().padStart(2, "0") + ":00",
      temp: Math.round(22 + Math.random() * 10),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      rain: Math.round(Math.random() * 80),
    };
  });
}

export default function WeatherPanel({ onWeatherUpdate, enabled }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherOverlayData | null>(null);
  const [forecast, setForecast] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 600));
    const data = generateMumiasWeather();
    const hourly = generateHourlyForecast();
    setWeather(data);
    setForecast(hourly);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWeather();
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => void fetchWeather(), 600000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Always push weather data to parent; parent decides whether to show overlay
  useEffect(() => {
    if (weather) {
      onWeatherUpdate(enabled ? weather : null);
    }
  }, [enabled, weather, onWeatherUpdate]);

  const getConditionColor = (condition: string) => {
    if (condition.includes("Rain") || condition.includes("Storm")) return "text-blue-400";
    if (condition.includes("Sunny") || condition.includes("Clear")) return "text-yellow-400";
    return "text-slate-300";
  };

  const getHumidityLabel = (h: number) => {
    if (h < 40) return { label: "Dry", color: "text-yellow-400" };
    if (h < 70) return { label: "Comfortable", color: "text-green-400" };
    return { label: "Humid", color: "text-blue-400" };
  };

  const getVisibilityLabel = (v: number) => {
    if (v < 5) return { label: "Poor", color: "text-red-400" };
    if (v < 10) return { label: "Moderate", color: "text-yellow-400" };
    return { label: "Good", color: "text-green-400" };
  };

  const isAdverse = weather
    ? weather.condition.includes("Storm") || weather.condition.includes("Rain") || weather.visibility < 5
    : false;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Mumias Weather</h3>
          {lastUpdated && (
            <p className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchWeather}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !weather ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : weather ? (
        <>
          {/* Main Weather Card */}
          <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 rounded-xl p-4 border border-blue-800/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-4xl font-bold text-white">{weather.temperature}°C</div>
                <div className={`text-sm font-medium mt-0.5 ${getConditionColor(weather.condition)}`}>
                  {weather.condition}
                </div>
              </div>
              <Cloud size={48} className="text-blue-300 opacity-60" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                <Droplets size={14} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Humidity</div>
                  <div className="text-sm font-semibold text-white">
                    {weather.humidity}%{" "}
                    <span className={`text-xs ${getHumidityLabel(weather.humidity).color}`}>
                      {getHumidityLabel(weather.humidity).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                <Wind size={14} className="text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-400">Wind</div>
                  <div className="text-sm font-semibold text-white">
                    {weather.windSpeed} km/h {weather.windDirection}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                <Eye size={14} className="text-purple-400" />
                <div>
                  <div className="text-xs text-slate-400">Visibility</div>
                  <div className="text-sm font-semibold text-white">
                    {weather.visibility} km{" "}
                    <span className={`text-xs ${getVisibilityLabel(weather.visibility).color}`}>
                      {getVisibilityLabel(weather.visibility).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                <Thermometer size={14} className="text-orange-400" />
                <div>
                  <div className="text-xs text-slate-400">Feels Like</div>
                  <div className="text-sm font-semibold text-white">
                    {weather.temperature + Math.round(weather.humidity / 20 - 2)}°C
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Driving Advisory */}
          <div
            className={`rounded-xl p-3 border text-sm ${
              isAdverse
                ? "bg-orange-900/30 border-orange-700/50 text-orange-300"
                : "bg-green-900/30 border-green-700/50 text-green-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-1">
              {isAdverse ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle size={14} />
              )}
              {weather.condition.includes("Storm")
                ? "Driving Advisory"
                : weather.visibility < 5
                ? "Low Visibility Warning"
                : "Good Driving Conditions"}
            </div>
            <div className="text-xs opacity-80">
              {weather.condition.includes("Storm")
                ? "Thunderstorm detected. Reduce speed and avoid flooded roads near Mumias Sugar Factory area."
                : weather.condition.includes("Rain")
                ? "Light rain may cause slippery roads. Allow extra stopping distance."
                : weather.visibility < 5
                ? "Poor visibility on A1 highway. Use headlights and reduce speed."
                : "Weather conditions are favorable for travel in the Mumias region."}
            </div>
          </div>

          {/* Hourly Forecast */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              6-Hour Forecast
            </label>
            <div className="grid grid-cols-6 gap-1">
              {forecast.map((f, i) => (
                <div
                  key={i}
                  className="bg-slate-700/50 rounded-lg p-2 text-center border border-slate-600/30"
                >
                  <div className="text-xs text-slate-400">{f.hour}</div>
                  <Cloud size={14} className="text-blue-300 mx-auto my-1" />
                  <div className="text-xs font-semibold text-white">{f.temp}°</div>
                  <div className="text-xs text-blue-400">{f.rain}%</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 text-center mt-1">% = rain probability</div>
          </div>

          {/* Overlay Toggle Info */}
          <div className="text-xs text-slate-500 text-center">
            {enabled ? (
              <span className="text-blue-400">Weather overlay active on map</span>
            ) : (
              <span>Toggle weather overlay in the toolbar above</span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
