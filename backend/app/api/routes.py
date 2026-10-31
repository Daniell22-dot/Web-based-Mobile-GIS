from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "MumiasGIS API"}


@router.get("/map/markers")
async def get_map_markers():
    """Get all map markers"""
    return []


@router.post("/map/markers")
async def add_map_marker():
    """Add a new map marker"""
    return {"id": 1, "success": True}


@router.post("/routes/simulated")
async def calculate_simulated_route():
    """Calculate simulated route (fallback)"""
    import math
    
    R = 6371000
    lat1, lng1 = 0.3667, 34.4833  # Mumias centre
    lat2, lng2 = 0.2827, 34.7519  # Kakamega
    
    dLat = (lat2 - lat1) * math.pi / 180
    dLng = (lng2 - lng1) * math.pi / 180
    lat1_rad = lat1 * math.pi / 180
    lat2_rad = lat2 * math.pi / 180
    
    x = math.sin(dLat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dLng/2)**2
    distance = R * 2 * math.atan2(math.sqrt(x), math.sqrt(1-x))
    
    avg_speed = 40
    duration = (distance / 1000) / avg_speed * 3600
    
    steps = 50
    coordinates = []
    for i in range(steps + 1):
        t = i / steps
        lat = lat1 + (lat2 - lat1) * t
        lng = lng1 + (lng2 - lng1) * t
        deviation = math.sin(t * math.pi) * 0.002 * (0.5 - t)
        coordinates.append([lat + deviation, lng + deviation])
    
    return {
        "coordinates": coordinates,
        "distance": distance,
        "duration": duration,
        "color": "#3b82f4",
    }


@router.post("/routes/ors")
async def calculate_ors_route():
    """Calculate route using OpenRouteService API"""
    import httpx
    
    ors_api_key = "your-openrouteservice-api-key-here"
    if not ors_api_key:
        raise HTTPException(500, "ORS API key not configured")
    
    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {"Authorization": ors_api_key}
    
    coords = [[0.3667, 34.4833], [0.2827, 34.7519]]
    body = {"coordinates": coords, "instructions": False}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers, timeout=30.0)
    
    if response.status_code != 200:
        raise HTTPException(502, f"ORS API error: {response.text}")
    
    data = response.json()
    
    if not data.get("features"):
        raise HTTPException(502, "No route found from OpenRouteService")
    
    route_coords = data["features"][0]["geometry"]["coordinates"]
    properties = data["features"][0]["properties"]["summary"]
    distance = properties.get("distance", 0)
    duration = properties.get("duration", 0)
    
    return {
        "coordinates": [[lng, lat] for lat, lng in route_coords],
        "distance": distance,
        "duration": duration,
    }


@router.get("/weather")
async def get_weather():
    """Get current weather"""
    return {
        "temperature": 28.5,
        "condition": "Partly Cloudy",
        "humidity": 65,
        "windSpeed": 12,
        "windDirection": "NE",
        "visibility": 15,
        "icon": "partly-cloudy",
    }


@router.get("/traffic")
async def get_traffic():
    """Get current traffic data"""
    import random
    levels = ["low", "moderate", "high", "severe"]
    weights = [0.4, 0.35, 0.2, 0.05]
    rand = random.random()
    cum = 0
    level = "low"
    for i, w in enumerate(weights):
        cum += w
        if rand < cum:
            level = levels[i]
            break
    
    speed_map = {"low": 45, "moderate": 30, "high": 18, "severe": 8}
    incident_count = random.randint(0, 3)
    
    incidents = []
    for i in range(incident_count):
        incidents.append({
            "id": f"inc-{i}",
            "type": random.choice(["Road Works", "Accident", "Flooding", "Market Congestion"]),
            "description": f"{random.choice(['A1 Highway', 'B8 Road'])} - {random.choice(['Expect delays', 'Use alternate route'])}",
            "severity": random.choice(["minor", "moderate", "major"]),
            "position": [0.3667 + (random.random() - 0.5) * 0.08, 34.4833 + (random.random() - 0.5) * 0.08],
        })
    
    return {
        "congestionLevel": level,
        "averageSpeed": speed_map.get(level, 30) + random.randint(-5, 5),
        "incidents": incidents,
    }