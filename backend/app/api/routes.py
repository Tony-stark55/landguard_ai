from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any

from backend.app.config import settings
from backend.app.services.weather_service import fetch_weather_open_meteo
from backend.app.services.risk_engine import calculate_risk
from backend.app.services.alert_service import evaluate_and_create_alert, get_all_active_alerts
from backend.app.services.terrain_service import get_terrain_features, NER_TERRAIN_DATABASE
from backend.app.services.historical_service import get_historical_landslides, VERIFIED_HISTORICAL_EVENTS
from backend.app.models.schemas import AnalyzeLocationRequest

router = APIRouter(prefix="/api")

# Standard monitored NER regional locations
SAMPLE_LOCATIONS = [
    {"id": "sik-gangtok", "name": "Gangtok Corridor (NH-10 / 9th Mile)", "state": "Sikkim", "district": "East Sikkim", "latitude": 27.3389, "longitude": 88.6065, "slope": 38.0, "elevation": 1650.0},
    {"id": "sik-mangan", "name": "Mangan - Dzongu Valley Sector", "state": "Sikkim", "district": "North Sikkim", "latitude": 27.5085, "longitude": 88.5284, "slope": 42.0, "elevation": 1310.0},
    {"id": "sik-namchi", "name": "Namchi - Jorethang Ridge", "state": "Sikkim", "district": "South Sikkim", "latitude": 27.1664, "longitude": 88.3639, "slope": 28.0, "elevation": 1315.0},
    {"id": "meg-sohra", "name": "Cherrapunji (Sohra) Escarpment", "state": "Meghalaya", "district": "East Khasi Hills", "latitude": 25.2702, "longitude": 91.7323, "slope": 46.0, "elevation": 1430.0},
    {"id": "meg-shillong", "name": "Shillong Peak & Upper Shillong Slope", "state": "Meghalaya", "district": "East Khasi Hills", "latitude": 25.5788, "longitude": 91.8933, "slope": 24.0, "elevation": 1525.0},
    {"id": "asm-haflong", "name": "Haflong - Jatinga Hill Ridge", "state": "Assam", "district": "Dima Hasao", "latitude": 25.1742, "longitude": 93.0245, "slope": 39.0, "elevation": 680.0},
    {"id": "nag-kohima", "name": "Kohima - Phesama Bypass (NH-29)", "state": "Nagaland", "district": "Kohima", "latitude": 25.6751, "longitude": 94.1086, "slope": 36.0, "elevation": 1444.0},
    {"id": "miz-aizawl", "name": "Aizawl (Hunthar & Ramhlun Fault Zone)", "state": "Mizoram", "district": "Aizawl", "latitude": 23.7271, "longitude": 92.7176, "slope": 43.0, "elevation": 1132.0},
    {"id": "man-noney", "name": "Noney - Tupul Railway Corridor (NH-37)", "state": "Manipur", "district": "Noney", "latitude": 24.8118, "longitude": 93.6552, "slope": 47.0, "elevation": 480.0},
    {"id": "aru-itanagar", "name": "Itanagar - Papum Pare Hill Cut (NH-415)", "state": "Arunachal Pradesh", "district": "Papum Pare", "latitude": 27.0844, "longitude": 93.6053, "slope": 34.0, "elevation": 320.0}
]

INFRASTRUCTURE_DATA = [
    {"id": "inf-gt-1", "location_id": "sik-gangtok", "name": "STNM Multi-Specialty Hospital Sochakgang", "type": "hospital", "latitude": 27.315, "longitude": 88.595, "distance_km": 1.4, "capacity_or_population": 450},
    {"id": "inf-gt-2", "location_id": "sik-gangtok", "name": "Government Senior Secondary School Tadong", "type": "school", "latitude": 27.321, "longitude": 88.601, "distance_km": 0.8, "capacity_or_population": 620},
    {"id": "inf-gt-3", "location_id": "sik-gangtok", "name": "National Highway 10 (Sikkim Lifeline)", "type": "road", "latitude": 27.332, "longitude": 88.604, "distance_km": 0.2},
    {"id": "inf-gt-4", "location_id": "sik-gangtok", "name": "Ranipool Residential Settlement", "type": "settlement", "latitude": 27.305, "longitude": 88.589, "distance_km": 1.9, "capacity_or_population": 3200},
    {"id": "inf-mg-1", "location_id": "sik-mangan", "name": "Mangan District Hospital", "type": "hospital", "latitude": 27.511, "longitude": 88.531, "distance_km": 0.6, "capacity_or_population": 120},
    {"id": "inf-mg-2", "location_id": "sik-mangan", "name": "North Sikkim Highway (BRO Corridor)", "type": "road", "latitude": 27.509, "longitude": 88.527, "distance_km": 0.1},
    {"id": "inf-hf-1", "location_id": "asm-haflong", "name": "New Haflong Junction Railway Station", "type": "critical_infrastructure", "latitude": 25.179, "longitude": 93.016, "distance_km": 0.8},
    {"id": "inf-hf-2", "location_id": "asm-haflong", "name": "Haflong Civil Hospital", "type": "hospital", "latitude": 25.172, "longitude": 93.029, "distance_km": 1.1, "capacity_or_population": 150}
]

@router.get("/health")
def get_health():
    """Health check endpoint confirming API and backend services are operational."""
    return {
        "status": "healthy",
        "service": "LANDGUARD AI Backend",
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "weather_source": "Open-Meteo Free API (No Key Required)",
        "database": "Supabase PostgreSQL" if settings.SUPABASE_URL else "Local Active Telemetry Memory"
    }

@router.get("/dashboard")
def get_dashboard_summary():
    """Returns high-level statistics for the live disaster management dashboard."""
    assessments = []
    alerts = []
    
    for loc in SAMPLE_LOCATIONS:
        weather = fetch_weather_open_meteo(loc["latitude"], loc["longitude"], loc["id"])
        terrain = get_terrain_features(loc["id"])
        merged_loc = {**loc, **terrain}
        risk = calculate_risk(merged_loc, weather, VERIFIED_HISTORICAL_EVENTS)
        assessments.append({"location": loc, "weather": weather, "risk": risk})
        
        # Check alerts
        alert = evaluate_and_create_alert(loc, risk)
        if alert:
            alerts.append(alert)

    critical_count = sum(1 for a in assessments if a["risk"]["risk_level"] == "CRITICAL")
    high_count = sum(1 for a in assessments if a["risk"]["risk_level"] == "HIGH")
    moderate_count = sum(1 for a in assessments if a["risk"]["risk_level"] == "MODERATE")
    low_count = sum(1 for a in assessments if a["risk"]["risk_level"] == "LOW")

    return {
        "active_alerts_count": len(alerts),
        "critical_zones_count": critical_count,
        "high_risk_zones_count": high_count,
        "moderate_risk_count": moderate_count,
        "low_risk_count": low_count,
        "monitored_locations_count": len(SAMPLE_LOCATIONS),
        "demo_mode": settings.DEMO_MODE,
        "top_risk_locations": sorted(assessments, key=lambda x: x["risk"]["risk_score"], reverse=True)[:5],
        "recent_alerts": alerts[:5]
    }

@router.get("/locations")
def list_locations():
    """Returns all monitored locations with coordinates and terrain metadata."""
    return SAMPLE_LOCATIONS

@router.get("/risk")
def get_all_risks():
    """Calculates and returns multi-factor risk assessments for all monitored sectors."""
    results = []
    for loc in SAMPLE_LOCATIONS:
        weather = fetch_weather_open_meteo(loc["latitude"], loc["longitude"], loc["id"])
        terrain = get_terrain_features(loc["id"])
        merged = {**loc, **terrain}
        risk = calculate_risk(merged, weather, VERIFIED_HISTORICAL_EVENTS)
        results.append({
            "location_id": loc["id"],
            "name": loc["name"],
            "state": loc["state"],
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "risk_assessment": risk
        })
    return results

@router.get("/risk/{location_id}")
def get_risk_for_location(location_id: str):
    """Returns detailed risk assessment for a specific location ID."""
    loc = next((l for l in SAMPLE_LOCATIONS if l["id"] == location_id), None)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found")
        
    weather = fetch_weather_open_meteo(loc["latitude"], loc["longitude"], loc["id"])
    terrain = get_terrain_features(loc["id"])
    merged = {**loc, **terrain}
    risk = calculate_risk(merged, weather, VERIFIED_HISTORICAL_EVENTS)
    return {
        "location": loc,
        "terrain": terrain,
        "weather": weather,
        "risk_assessment": risk
    }

@router.get("/weather/{location_id}")
def get_weather_for_location(location_id: str):
    """Returns current and forecast weather telemetry for a location via Open-Meteo."""
    loc = next((l for l in SAMPLE_LOCATIONS if l["id"] == location_id), None)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location {location_id} not found")
    return fetch_weather_open_meteo(loc["latitude"], loc["longitude"], loc["id"], loc["name"])

@router.get("/alerts")
def get_alerts():
    """Returns currently active early-warning advisories."""
    return get_all_active_alerts()

@router.get("/historical-events")
def get_historical_events(
    state: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Returns historical landslide records filtered by state, date, or severity."""
    return get_historical_landslides(state=state, severity=severity, start_date=start_date, end_date=end_date)

@router.get("/infrastructure")
def get_infrastructure(location_id: Optional[str] = Query(None), infra_type: Optional[str] = Query(None)):
    """Returns nearby infrastructure assets (schools, hospitals, roads, settlements)."""
    items = INFRASTRUCTURE_DATA
    if location_id:
        items = [i for i in items if i.get("location_id") == location_id]
    if infra_type:
        items = [i for i in items if i.get("type") == infra_type]
    return items

@router.post("/analyze-location")
def analyze_custom_location(payload: AnalyzeLocationRequest):
    """
    On-demand risk assessment for any arbitrary GPS point in North East India.
    Useful for Citizen View GPS location analysis or custom engineer surveys.
    """
    lat = payload.latitude
    lng = payload.longitude
    slope = payload.slope_deg if payload.slope_deg is not None else 32.0
    elev = payload.elevation_m if payload.elevation_m is not None else 1250.0

    weather = fetch_weather_open_meteo(lat, lng)
    loc_meta = {
        "id": "custom-point",
        "name": payload.name or f"Point ({lat:.3f}, {lng:.3f})",
        "latitude": lat,
        "longitude": lng,
        "slope": slope,
        "elevation": elev,
        "terrain_ruggedness": 65.0,
        "lithology": "Regional Schist & Siltstone Formation"
    }

    risk = calculate_risk(loc_meta, weather, VERIFIED_HISTORICAL_EVENTS)
    return {
        "coordinates": {"latitude": lat, "longitude": lng},
        "weather": weather,
        "risk_assessment": risk
    }

@router.get("/risk-history/{location_id}")
def get_risk_history(location_id: str):
    """Returns historical risk trend for time-series charts (12 PM -> 42, 1 PM -> 48, etc.)."""
    # Deterministic hourly trend series based on antecedent precipitation build-up
    return {
        "location_id": location_id,
        "trend_data": [
            {"time": "12:00 PM", "score": 42, "rain_accumulated": 58},
            {"time": "01:00 PM", "score": 48, "rain_accumulated": 72},
            {"time": "02:00 PM", "score": 61, "rain_accumulated": 96},
            {"time": "03:00 PM", "score": 72, "rain_accumulated": 124},
            {"time": "04:00 PM", "score": 86, "rain_accumulated": 162}
        ]
    }
