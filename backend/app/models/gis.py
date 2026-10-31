from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.core.config import settings

class MapMarker(Base):
    __tablename__ = "map_markers"
    
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    type = Column(String, nullable=False)  # origin/destination/waypoint/poi
    position_lat = Column(Float, nullable=False)
    position_lng = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RouteData(Base):
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    color = Column(String, default="#3b82f4")
    coordinates = Column(JSON, nullable=False)  # [lat, lng] pairs
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WeatherOverlay(Base):
    __tablename__ = "weather_overlays"
    
    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float, nullable=False)
    condition = Column(String, nullable=False)
    humidity = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    wind_direction = Column(String, nullable=False)
    visibility = Column(Float, nullable=False)
    icon = Column(String, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class TrafficIncident(Base):
    __tablename__ = "traffic_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # minor/moderate/major
    position_lat = Column(Float, nullable=False)
    position_lng = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TrafficData(Base):
    __tablename__ = "traffic_data"
    
    id = Column(Integer, primary_key=True, index=True)
    congestion_level = Column(String, nullable=False)  # low/moderate/high/severe
    average_speed = Column(Float, nullable=False)
    incident_count = Column(Integer, default=0)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())