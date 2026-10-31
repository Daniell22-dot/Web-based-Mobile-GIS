from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.config import settings
from app.db.session import get_db, SessionLocal
from app.models.gis import MapMarker, RouteData, WeatherOverlay, TrafficIncident, TrafficData

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
async def health(db: Session = Depends(get_db)):
    """Health check"""
    return {"status": "healthy", "service": "MumiasGIS API"}


@router.get("/map/markers", response_model=List[dict])
async def get_map_markers(db: Session = Depends(get_db)):
    """Get all map markers"""
    markers = db.query(MapMarker).all()
    return [
        {
            "id": m.id,
            "label": m.label,
            "type": m.type,
            "position": [m.position_lat, m.position_lng],
        }
        for m in markers
    ]


@router.post("/map/markers")
async def add_map_marker(marker_data: dict, db: Session = Depends(get_db)):
    """Add a new map marker"""
    from sqlalchemy import insert
    from app.models.gis import MapMarker as MM
    
    marker = MM(
        label=marker_data.get("label", ""),
        type=marker_data.get("type", "poi"),
        position_lat=marker_data.get("position", [0, 0])[0],
        position_lng=marker_data.get("position", [0, 0])[1],
    )
    db.add(marker)
    db.commit()
    db.refresh(marker)
    return {"id": marker.id, "success": True}


@router.post("/routes/simulated", response_model=dict)
async def calculate_simulated_route(
    origin: list,
    destination: list,
    db: Session = Depends(get_db),
):
    """Calculate simulated route (fallback when ORS not available)"""
    import math
    
    R = 6371000  # Earth radius in meters
    lat1, lng1 = origin
    lat2, lng2 = destination
    
    dLat = (lat2 - lat1) * math.pi / 180
    dLng = (lng2 - lng1) * math.pi / 180
    lat1_rad = lat1 * math.pi / 180
    lat2_rad = lat2 * math.pi / 180
    
    x = math.sin(dLat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dLng/2)**2
    distance = R * 2 * math.atan2(math.sqrt(x), math.sqrt(1-x))
    
    avg_speed = 40  # Mumias urban average km/h
    duration = (distance / 1000) / avg_speed * 3600  # seconds
    
    # Generate coordinates along the route
    steps = 50
    coordinates = []
    for i in range(steps + 1):
        t = i / steps
        lat = lat1 + (lat2 - lat1) * t
        lng = lng1 + (lng2 - lng1) * t
        # Add slight deviation for road-like path
        deviation = math.sin(t * math.pi) * 0.002 * (0.5 - t)
        coordinates.append([lat + deviation, lng + deviation])
    
    # Save route to database
    from sqlalchemy import insert as sql_insert
    from app.models.gis import RouteData as RD
    
    route = RD(
        origin_lat=lat1,
        origin_lng=lng1,
        destination_lat=lat2,
        destination_lng=lng2,
        distance_meters=distance,
        duration_seconds=duration,
        color="#3b82f4",
        coordinates=coordinates,
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    
    return {
        "coordinates": coordinates,
        "distance": distance,
        "duration": duration,
        "color": "#3b82f4",
        "route_id": route.id,
    }


@router.post("/routes/ors", response_model=dict)
async def calculate_ors_route(
    origin: list,
    destination: list,
    db: Session = Depends(get_db),
):
    """Calculate route using OpenRouteService API"""
    import httpx
    import os
    
    ors_api_key = os.getenv("ORS_API_KEY")
    if not ors_api_key:
        raise HTTPException(
            500, 
            "OpenRouteService API key not configured. Set ORS_API_KEY in .env"
        )
    
    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {"Authorization": ors_api_key}
    
    # ORS expects [lon, lat] format
    # User provides [lat, lng] from UI, so convert
    coords = [
        [origin[1], origin[0]],  # [lng, lat] for first point
        [destination[1], destination[0]],  # [lng, lat] for second point
    ]
    
    body = {
        "coordinates": coords,
        "instructions": False,
        "format": "geojson",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers, timeout=30.0)
    
    if response.status_code != 200:
        raise HTTPException(
            502, 
            f"OpenRouteService API error: {response.text}"
        )
    
    data = response.json()
    
    if not data.get("features") or len(data["features"]) == 0:
        raise HTTPException(502, "No route found from OpenRouteService")
    
    # Extract route geometry coordinates
    # ORS returns [lon, lat], we need to convert for Leaflet ([lat, lng] or keep [lng, lat])
    route_coords = data["features"][0]["geometry"]["coordinates"]
    
    # Convert [lon, lat] to [lat, lng] for consistency with app's internal format
    # Actually, Leaflet uses [lng, lat] for most things, but our model stores [lat, lng]
    # Let's keep as [lng, lat] since that's what Leaflet expects, and convert when saving
    converted_coords = [[lng, lat] for lat, lng in route_coords]
    
    # Calculate distance and duration from the route summary
    properties = data["features"][0]["properties"]["summary"]
    distance = properties.get("distance", 0)  # meters
    duration = properties.get("duration", 0)  # seconds
    
    # Save route to database
    from sqlalchemy import insert as sql_insert
    from app.models.gis import RouteData as RD
    
    # Convert coords back to [lat, lng] for storage
    # Our model expects coordinates in [lat, lng] format based on earlier design
    coords_for_db = [[lat, lng] for lng, lat in route_coords]
    
    route = RD(
        origin_lat=origin[0],
        origin_lng=origin[1],
        destination_lat=destination[0],
        destination_lng=destination[1],
        distance_meters=distance,
        duration_seconds=duration,
        color="#3b82f4",
        coordinates=coords_for_db,
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    
    return {
        "coordinates": converted_coords,  # [lng, lat] for Leaflet display
        "distance": distance,
        "duration": duration,
        "color": "#3b82f4",
        "route_id": route.id,
        "source": "openrouteservice",
    }


@router.get("/weather")
async def get_weather(db: Session = Depends(get_db)):
    """Get current weather"""
    # Return last weather record or simulate
    weather = db.query(WeatherOverlay).order_by(WeatherOverlay.recorded_at.desc()).first()
    if weather:
        return {
            "temperature": weather.temperature,
            "condition": weather.condition,
            "humidity": weather.humidity,
            "windSpeed": weather.wind_speed,
            "windDirection": weather.wind_direction,
            "visibility": weather.visibility,
            "icon": weather.icon,
        }
    # Fallback simulated data
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
async def get_traffic(db: Session = Depends(get_db)):
    """Get current traffic data"""
    traffic = db.query(TrafficData).order_by(TrafficData.recorded_at.desc()).first()
    if traffic:
        incidents = db.query(TrafficIncident).all()
        return {
            "congestionLevel": traffic.congestion_level,
            "averageSpeed": traffic.average_speed,
            "incidents": [
                {
                    "id": inc.id,
                    "type": inc.type,
                    "description": inc.description,
                    "severity": inc.severity,
                    "position": [inc.position_lat, inc.position_lng],
                }
                for inc in incidents
            ],
        }
    # Fallback simulated data
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
            "description": f"{random.choice(['A1 Highway', 'B8 Road', 'Mumias Town', 'Sugar Factory'])} - {random.choice(['Expect delays', 'Use alternate route'])}",
            "severity": random.choice(["minor", "moderate", "major"]),
            "position": [
                0.3667 + (random.random() - 0.5) * 0.08,
                34.4833 + (random.random() - 0.5) * 0.08,
            ],
        })
    
    return {
        "congestionLevel": level,
        "averageSpeed": speed_map.get(level, 30) + random.randint(-5, 5),
        "incidents": incidents,
    }