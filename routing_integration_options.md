# Routing Service Integration Options

## Current State
The frontend (`RoutePanel.tsx`) uses **client-side simulated routing**:
- `generateSimulatedRoute()` creates arbitrary polylines between points
- No real distance/time calculations
- No integration with external routing services
- Used only for UI prototyping

## Two Main Options for Real Routing

### Option 1: OSRM (Open Source Routing Machine)
**Pros:**
- Free, no API keys needed
- Self-hostable (Docker: `docker run -p 5000:5000 osrm/osrm-backend:latest`)
- Fast tile-server compatible
- OpenStreetMap data-based routes

**Cons:**
- Requires server infrastructure
- Data updates require OSM parsing
- Limited turn-by-turn directions

**Integration with Python Backend:**
```python
# backend/app/api/routes.py - OSRM integration
import httpx

@router.post("/routes/osrm")
async def calculate_osrm_route(origin: list, destination: list):
    osrm_url = "http://localhost:5000/route/v1/driving"
    params = {"overview": "false"}
    
    coordinates = f"{origin[1]},{origin[0]};{destination[1]}, {destination[0]}"
    response = await client.get(f"{osrm_url}/{coordinates}", params=params)
    data = response.json()
    
    if data["code"] == "Ok":
        return {
            "coordinates": [["lat", "lng"] for lat, lng in data["routes"][0]["geometry"]["coordinates"]],
            "distance": data["routes"][0]["distance"],
            "duration": data["routes"][0]["duration"],
        }
    raise HTTPException(502, "OSRM routing failed")
```

**Frontend change** (`RoutePanel.tsx`):
```tsx
// Replace calculateRoute to call backend
const calculateRoute = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/routes/osrm`, {
    method: "POST",
    body: JSON.stringify({ origin, destination }),
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  onRoutesChange(data.coordinates.map(c => [c[1], c[0]] as [number, number])); // [lng, lat] for Leaflet
  // ... rest
};
```

---

### Option 2: OpenRouteService (Commercial API)
**Pros:**
- Turn-by-turn directions
- Multiple profiles (driving, cycling, foot)
- Elevation data, scenic routes
- Good documentation, global coverage
- Free tier: 2,500 requests/day

**Cons:**
- Requires API key (free registration)
- Rate limits on free tier
- Commercial usage terms

**Integration with Python Backend:**
```python
# backend/app/api/routes.py - OpenRouteService integration
import os
import httpx

ORS_API_KEY = os.getenv("ORS_API_KEY")

@router.post("/routes/ors")
async def calculate_ors_route(origin: list, destination: list):
    if not ORS_API_KEY:
        raise HTTPException(500, "ORS API key not configured")
    
    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {"Authorization": ORS_API_KEY}
    body = {
        "coordinates": [[origin[1], origin[0]], [destination[1], destination[0]]],  # [lon, lat]
        "instructions": False
    }
    
    response = await client.post(url, json=body, headers=headers)
    data = response.json()
    
    if data["features"][0]:
        coords = data["features"][0]["geometry"]["coordinates"]
        return {
            "coordinates": [[lng, lat] for lat, lng in coords],  # Convert for Leaflet
            "distance": data["features"][0]["properties"]["summary"]["distance"],
            "duration": data["features"][0]["properties"]["summary"]["duration"],
        }
    raise HTTPException(502, "ORS routing failed")
```

**Frontend change** (`RoutePanel.tsx`): Same pattern - call `/api/routes/ors`

---

## Recommended Approach for MumiasGIS

### Recommended: **OpenRouteService** (Free Tier)
Why:
1. **No server infrastructure** needed - just API key
2. **Better quality routes** - based on OSM + road hierarchy
3. **Turn-by-turn directions** possible
4. **Global coverage** - if user expands beyond Mumias
5. **Free tier sufficient** - ~8750 requests/month for MumiasGIS usage

### Implementation Plan:

**1. Backend** (`backend/app/api/routes.py`):
- Add `ORS_API_KEY` env var
- Implement `/api/routes/ors` endpoint
- Keep `/api/routes/simulated` for fallback

**2. Frontend** (`src/app/page.tsx`, `src/components/routing/RoutePanel.tsx`):
- Add API route calling
- Switch between simulated/ORS based on config
- Display route coordinates correctly (Leaflet uses [lng, lat])

**3. .env**:
```
ORS_API_KEY="your-openrouteservice-free-tier-key"
```

**4. Database** (optional):
- Store route history for analytics
- Save user-favorite routes

---

## Modified Backend API Endpoints (Updated `requirements`)

Add to `backend/requirements.txt`:
```
fastapi
uvicorn[standard]
sqlalchemy
pydantic
pydantic-settings
python-dotenv
httpx
```

Add to `backend/app/api/routes.py`:
- `POST /api/routes/ors` - OpenRouteService integration
- `POST /api/routes/simulated` - Keep simulated fallback
- `GET /api/routes/markers` - Get saved markers from DB

---

## Quick Integration Checklist

- [ ] Get free ORS API key from https://openrouteservice.org/dev/quick-start/
- [ ] Add `ORS_API_KEY` to `.env`
- [ ] Add ORS endpoint to `backend/app/api/routes.py`
- [ ] Modify `RoutePanel.tsx` `calculateRoute` to fetch from backend
- [ ] Update `MapComponent` to accept [lng, lat] from backend
- [ ] Test route calculation end-to-end

Would you like me to:
1. **Implement the OpenRouteService integration** in the backend?
2. **Modify the frontend** to call the backend API for routes?
3. **Both** - full end-to-end integration?
4. **Keep simulated routing** and just add weather/traffic from backend?