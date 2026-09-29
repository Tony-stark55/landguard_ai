from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationBase(BaseModel):
    id: str
    name: str
    state: str
    district: str
    latitude: float
    longitude: float

class TerrainFeaturesSchema(BaseModel):
    elevation: float
    slope: float
    aspect: str
    terrain_ruggedness: float
    lithology: Optional[str] = None
    vegetation_cover: Optional[str] = None

class WeatherObservationSchema(BaseModel):
    location_id: str
    timestamp: str
    rainfall: float
    precipitation: float
    accumulated_72h: float
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    forecast_rainfall: float
    source: str

class RiskAssessmentSchema(BaseModel):
    location_id: str
    timestamp: str
    risk_score: float
    risk_level: str
    is_hotspot: bool
    explanation: str
    factors: Dict[str, Any]

class AlertSchema(BaseModel):
    location_id: str
    location_name: str
    risk_score: float
    risk_level: str
    message: str
    recommendation: str
    status: str
    created_at: str

class InfrastructureItemSchema(BaseModel):
    id: str
    name: str
    type: str
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    capacity_or_population: Optional[int] = None
    details: Optional[str] = None

class AnalyzeLocationRequest(BaseModel):
    latitude: float = Field(..., ge=20.0, le=32.0)
    longitude: float = Field(..., ge=87.0, le=98.0)
    name: Optional[str] = "Custom Monitored Hill Point"
    slope_deg: Optional[float] = None
    elevation_m: Optional[float] = None
