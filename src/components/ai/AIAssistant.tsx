"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, MapPin, Navigation } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  currentWeather?: string;
  currentTraffic?: string;
}

// AI response generator for GIS/routing context
function generateAIResponse(userMessage: string, weather: string, traffic: string): string {
  const msg = userMessage.toLowerCase();

  // Route-related queries
  if (msg.includes("route") || msg.includes("way") || msg.includes("how to get") || msg.includes("directions")) {
    if (msg.includes("kakamega")) {
      return `🗺️ **Route to Kakamega from Mumias:**\n\nThe best route is via the **A1 Highway** heading east:\n\n1. Start at Mumias Town Centre\n2. Take A1 Highway eastbound\n3. Pass through Butere (15 km)\n4. Continue to Kakamega (total ~45 km)\n\n⏱️ **Estimated time:** 55-70 minutes\n📏 **Distance:** ~45 km\n\n${traffic.includes("heavy") || traffic.includes("severe") ? "⚠️ Current traffic is heavy — consider departing after 9 AM." : "✅ Traffic is currently light on this route."}\n\nWant me to add this route to the map?`;
    }
    if (msg.includes("kisumu")) {
      return `🗺️ **Route to Kisumu from Mumias:**\n\nRecommended route via **A1 → B1 Highway:**\n\n1. Mumias → Kakamega via A1 (45 km)\n2. Kakamega → Kisumu via B1 (55 km)\n3. Total: ~100 km\n\n⏱️ **Estimated time:** 1.5-2 hours\n\n${weather.includes("rain") || weather.includes("storm") ? "🌧️ Rain detected — roads may be slippery near Lake Victoria. Drive carefully." : "☀️ Good weather for the journey."}\n\nAlternatively, take the Mumias-Busia road then south to Kisumu (longer but scenic).`;
    }
    if (msg.includes("busia") || msg.includes("border")) {
      return `🗺️ **Route to Busia Border from Mumias:**\n\nTake the **B8 Road** westbound:\n\n1. Mumias Town → B8 junction (2 km)\n2. B8 westbound through Matungu (20 km)\n3. Continue to Busia (total ~65 km)\n\n⏱️ **Estimated time:** 1-1.5 hours\n📏 **Distance:** ~65 km\n\n💡 **Tip:** The B8 road has some rough sections near Matungu. A 4WD vehicle is recommended during rainy season.`;
    }
    return `🗺️ I can help you find optimal routes in the **Mumias, Kenya** area!\n\nPopular destinations from Mumias:\n• **Kakamega** (45 km, ~1 hr via A1)\n• **Kisumu** (100 km, ~2 hrs)\n• **Busia Border** (65 km, ~1.5 hrs via B8)\n• **Webuye** (55 km, ~1.5 hrs)\n\nUse the **Route Planner** panel to set your origin and destination, or ask me about a specific route!`;
  }

  // Weather queries
  if (msg.includes("weather") || msg.includes("rain") || msg.includes("temperature") || msg.includes("climate")) {
    return `🌤️ **Mumias Weather Info:**\n\n**Current conditions:** ${weather || "Partly cloudy, ~26°C"}\n\n**Mumias Climate Overview:**\nMumias lies in western Kenya near Lake Victoria, giving it a tropical climate:\n\n• **Long rains:** March–May (heavy, can cause flooding)\n• **Short rains:** October–December\n• **Dry seasons:** June–September & January–February\n• **Average temp:** 20–30°C year-round\n• **Humidity:** 60–80% during rainy season\n\n🚗 **Driving tip:** During heavy rains, the Mumias-Butere road and low-lying areas near the sugar factory can flood. Always check conditions before travel.`;
  }

  // Traffic queries
  if (msg.includes("traffic") || msg.includes("congestion") || msg.includes("jam") || msg.includes("busy")) {
    return `🚦 **Mumias Traffic Update:**\n\n**Current status:** ${traffic || "Moderate traffic in town centre"}\n\n**Peak hours in Mumias:**\n• **Morning rush:** 7:00–9:00 AM (school & factory workers)\n• **Market days:** Tuesday & Friday (Mumias Market gets very busy)\n• **Evening rush:** 5:00–7:00 PM\n\n**Congestion hotspots:**\n• Mumias Town Centre roundabout\n• Sugar Factory access road (shift changes)\n• A1 Highway junction\n\n💡 **Tip:** Avoid the town centre between 7-9 AM on weekdays. Use the bypass road via the hospital area.`;
  }

  // POI queries
  if (msg.includes("hospital") || msg.includes("medical") || msg.includes("health")) {
    return `🏥 **Medical Facilities near Mumias:**\n\n1. **Mumias District Hospital** - Main referral hospital\n   📍 Off Mumias-Kakamega Road\n   📞 Emergency services available\n\n2. **Mumias Sugar Company Hospital** - For factory workers\n   📍 Sugar Factory compound\n\n3. **St. Mary's Mission Hospital, Mumias** - Catholic mission hospital\n   📍 Town centre area\n\n🚑 **Emergency:** Dial 999 or 0800 723 000 (Kenya Red Cross)\n\nWant me to show these on the map?`;
  }

  if (msg.includes("market") || msg.includes("shopping") || msg.includes("buy")) {
    return `🛒 **Markets & Shopping in Mumias:**\n\n**Mumias Main Market:**\n• Location: Town centre\n• Market days: Tuesday & Friday (busiest)\n• Open daily for basic goods\n• Sells: Fresh produce, clothing, hardware\n\n**Mumias Sugar Factory Shop:**\n• Sugar products at factory prices\n• Open weekdays 8 AM–5 PM\n\n**Tips:**\n• Arrive early on market days (before 9 AM) to avoid congestion\n• Parking is limited on market days — consider walking from nearby streets`;
  }

  // GIS/map queries
  if (msg.includes("coordinates") || msg.includes("location") || msg.includes("where is mumias")) {
    return `📍 **Mumias Location Data:**\n\n**Coordinates:** 0.3667°N, 34.4833°E\n**County:** Kakamega County, Western Kenya\n**Elevation:** ~1,400 m above sea level\n**Area:** ~300 km²\n\n**Key landmarks:**\n• Mumias Sugar Company (major employer)\n• Mumias District Hospital\n• Mumias Market\n• A1 Highway (main artery)\n• B8 Road (to Busia)\n\n**Nearby towns:**\n• Kakamega: 45 km east\n• Busia: 65 km west\n• Kisumu: 100 km south\n• Webuye: 55 km north`;
  }

  // Fuel/petrol queries
  if (msg.includes("fuel") || msg.includes("petrol") || msg.includes("gas station")) {
    return `⛽ **Fuel Stations in Mumias:**\n\n1. **Total Energies** - A1 Highway junction\n2. **Kenol/Kobil** - Town centre\n3. **Shell** - Near Mumias Market\n4. **Rubis** - Kakamega Road\n\n💰 **Current fuel prices (approx.):**\n• Petrol: KES 180-195/litre\n• Diesel: KES 170-185/litre\n\n💡 **Tip:** Fuel up before heading to Busia — stations are sparse on the B8 road between Matungu and Busia.`;
  }

  // Help/capabilities
  if (msg.includes("help") || msg.includes("what can you") || msg.includes("capabilities")) {
    return `🤖 **I'm your Mumias GIS Assistant!**\n\nHere's what I can help with:\n\n🗺️ **Routing & Navigation**\n• Optimal routes between locations\n• Distance & time estimates\n• Alternative route suggestions\n\n🌤️ **Weather Intelligence**\n• Current conditions in Mumias\n• Driving advisories based on weather\n• Seasonal travel tips\n\n🚦 **Traffic Analysis**\n• Current congestion levels\n• Peak hour information\n• Incident alerts\n\n📍 **Local Knowledge**\n• Points of interest\n• Market days & schedules\n• Emergency services\n• Fuel stations\n\nJust ask me anything about getting around Mumias and western Kenya!`;
  }

  // Default response
  const responses = [
    `I'm your AI-powered GIS assistant for the **Mumias, Kenya** region! 🗺️\n\nI can help you with:\n• **Route planning** — "How do I get to Kakamega?"\n• **Weather conditions** — "Is it safe to drive today?"\n• **Traffic updates** — "Is the A1 highway busy?"\n• **Local info** — "Where is the nearest hospital?"\n\nWhat would you like to know?`,
    `Great question! For the **Mumias area**, I have detailed knowledge of:\n\n• Road network (A1, B8, local roads)\n• Weather patterns (tropical climate)\n• Traffic hotspots\n• Key facilities\n\nTry asking: *"What's the best route to Kisumu?"* or *"How's the traffic on A1 highway?"*`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

const SUGGESTED_PROMPTS = [
  "Best route to Kakamega?",
  "How's the traffic today?",
  "Weather driving conditions?",
  "Nearest hospital location?",
  "Route to Kisumu?",
  "Market days in Mumias?",
];

export default function AIAssistant({ currentWeather = "", currentTraffic = "" }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hello! I'm your **AI GIS Assistant** for Mumias, Kenya.\n\nI can help you plan optimal routes, check weather conditions, monitor traffic, and find local points of interest.\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userTs = new Date();
    const userMessage: Message = {
      id: `user-${userTs.getTime()}`,
      role: "user",
      content: messageText,
      timestamp: userTs,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const response = generateAIResponse(messageText, currentWeather, currentTraffic);

    const assistantTs = new Date();
    const assistantMessage: Message = {
      id: `assistant-${assistantTs.getTime()}`,
      role: "assistant",
      content: response,
      timestamp: assistantTs,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Bullet points
        if (line.startsWith("•")) {
          return `<div key="${i}" class="flex gap-2 text-sm"><span class="text-blue-400 shrink-0">•</span><span>${line.slice(1).trim()}</span></div>`;
        }
        // Numbered items
        if (/^\d+\./.test(line)) {
          return `<div key="${i}" class="text-sm ml-2">${line}</div>`;
        }
        // Headers (emoji + bold)
        if (line.match(/^[🗺️🌤️🚦📍⛽🏥🛒🤖👋]/)) {
          return `<div key="${i}" class="font-semibold text-sm mt-1">${line}</div>`;
        }
        if (line === "") return `<div key="${i}" class="h-1"></div>`;
        return `<div key="${i}" class="text-sm">${line}</div>`;
      })
      .join("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant" ? "bg-blue-600" : "bg-slate-600"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot size={14} className="text-white" />
              ) : (
                <User size={14} className="text-white" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-slate-700 text-slate-100 rounded-tl-sm"
              }`}
            >
              <div
                className="text-sm leading-relaxed space-y-0.5"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              <div className="text-xs opacity-50 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="py-2">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles size={12} className="text-blue-400" />
            <span className="text-xs text-slate-400">Suggested questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-full border border-slate-600 hover:border-blue-500 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-2 border-t border-slate-700">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about routes, weather, traffic..."
            rows={1}
            className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600"
            style={{ maxHeight: "80px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <MapPin size={10} className="text-slate-500" />
          <span className="text-xs text-slate-500">Mumias, Kenya · 0.3667°N, 34.4833°E</span>
        </div>
      </div>
    </div>
  );
}
