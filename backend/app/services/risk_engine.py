import math
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.database import get_supabase_client

logger = logging.getLogger("landguard.risk_engine")

def calculate_risk(
    location: Dict[str, Any],
    weather: Dict[str, Any],
    historical_events: Optional[List[Dict[str, Any]]] = None,
    custom_thresholds: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Transparent, explainable multi-factor landslide risk computation.
    
    Factors:
      1. Rainfall (Weight: 35%) - Current rate + 72-hr antecedent moisture
      2. Slope Gradient (Weight: 30%) - Critical angle thresholds (>30° critical)
      3. Historical Slip Proximity (Weight: 20%) - Spatial distance decay to prior slides
      4. Terrain Ruggedness & Lithology (Weight: 15%) - TRI & fragile rock mechanics
      
    Outputs:
      - risk_score: 0 to 100
      - risk_level: LOW (0-25), MODERATE (26-50), HIGH (51-75), CRITICAL (76-100)
      - is_hotspot: True if high rain + steep slope + historical slide overlap
      - explanation: Natural language justification grounded in real values
    """
    low_max = custom_thresholds.get("low_max", settings.THRESHOLD_LOW_MAX) if custom_thresholds else settings.THRESHOLD_LOW_MAX
    mod_max = custom_thresholds.get("mod_max", settings.THRESHOLD_MODERATE_MAX) if custom_thresholds else settings.THRESHOLD_MODERATE_MAX
    high_max = custom_thresholds.get("high_max", settings.THRESHOLD_HIGH_MAX) if custom_thresholds else settings.THRESHOLD_HIGH_MAX

    # 1. RAINFALL FACTOR (0-100)
    # Colluvial and residual soil mantles in NER saturate rapidly.
    # Current rainfall > 25 mm/h or 72h accumulated > 160 mm represent high risk.
    current_rain = float(weather.get("rainfall", 0.0) or weather.get("precipitation", 0.0))
    rain_72h = float(weather.get("accumulated_72h", 0.0))
    
    current_score = min(100.0, (current_rain / 30.0) * 100.0)
    antecedent_score = min(100.0, (rain_72h / 180.0) * 100.0)
    rainfall_factor = round((current_score * 0.4) + (antecedent_score * 0.6), 1)
    
    rainfall_level = "LOW" if rainfall_factor <= 35 else ("MEDIUM" if rainfall_factor <= 70 else "HIGH")

    # 2. SLOPE GRADIENT FACTOR (0-100)
    # Slopes < 15° rarely slide; 15-28° moderate; 28-45° high; > 45° extreme debris avalanche risk.
    slope_deg = float(location.get("slope", 25.0))
    if slope_deg < 15.0:
        slope_factor = (slope_deg / 15.0) * 25.0
    elif slope_deg < 30.0:
        slope_factor = 25.0 + ((slope_deg - 15.0) / 15.0) * 35.0
    elif slope_deg < 45.0:
        slope_factor = 60.0 + ((slope_deg - 30.0) / 15.0) * 30.0
    else:
        slope_factor = min(100.0, 90.0 + ((slope_deg - 45.0) / 15.0) * 10.0)
    slope_factor = round(slope_factor, 1)
    
    slope_level = "LOW" if slope_factor <= 35 else ("MEDIUM" if slope_factor <= 70 else "HIGH")

    # 3. HISTORICAL ACTIVITY FACTOR (0-100)
    # Geological Survey of India (GSI) studies show prior slide scars represent shear failure weakness.
    lat = float(location.get("latitude", location.get("lat", 0.0)))
    lng = float(location.get("longitude", location.get("lng", 0.0)))
    
    historical_factor = 20.0 # Default baseline
    nearest_dist_km = 999.0
    recent_count_nearby = 0

    if historical_events:
        for event in historical_events:
            e_lat = float(event.get("latitude", event.get("lat", 0.0)))
            e_lng = float(event.get("longitude", event.get("lng", 0.0)))
            
            # Haversine distance in km
            d_lat = math.radians(e_lat - lat)
            d_lng = math.radians(e_lng - lng)
            a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(e_lat)) * math.sin(d_lng / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = 6371.0 * c
            
            if dist_km < nearest_dist_km:
                nearest_dist_km = dist_km
            if dist_km <= 25.0:
                recent_count_nearby += 1

        if nearest_dist_km <= 5.0:
            historical_factor = 95.0
        elif nearest_dist_km <= 15.0:
            historical_factor = 75.0
        elif nearest_dist_km <= 35.0:
            historical_factor = 50.0
        else:
            historical_factor = 25.0
    else:
        # If no explicit list passed, check default historical proximity
        historical_factor = 45.0

    historical_level = "LOW" if historical_factor <= 35 else ("MEDIUM" if historical_factor <= 70 else "HIGH")

    # 4. TERRAIN CHARACTERISTICS & RUGGEDNESS (0-100)
    tri = float(location.get("terrain_ruggedness", location.get("ruggednessIndex", 50.0)))
    elevation = float(location.get("elevation", 1200.0))
    lithology = str(location.get("lithology", "")).lower()

    # Highly fragile formations get higher terrain susceptibility multiplier
    lithology_boost = 0.0
    if any(k in lithology for k in ["schist", "phyllite", "shale", "clay", "daling", "disang"]):
        lithology_boost = 15.0
    elif any(k in lithology for k in ["sandstone", "siltstone"]):
        lithology_boost = 8.0

    terrain_factor = min(100.0, round(tri * 0.7 + (min(elevation, 3000.0) / 3000.0) * 15.0 + lithology_boost, 1))
    terrain_level = "LOW" if terrain_factor <= 35 else ("MEDIUM" if terrain_factor <= 70 else "HIGH")

    # 5. COMPOSITE RISK SCORE
    w_rain = settings.WEIGHT_RAINFALL
    w_slope = settings.WEIGHT_SLOPE
    w_hist = settings.WEIGHT_HISTORICAL
    w_terr = settings.WEIGHT_TERRAIN
    
    composite = (rainfall_factor * w_rain) + (slope_factor * w_slope) + (historical_factor * w_hist) + (terrain_factor * w_terr)
    composite_score = round(min(100.0, max(0.0, composite)), 1)

    # Risk Level mapping
    if composite_score <= low_max:
        risk_level = "LOW"
    elif composite_score <= mod_max:
        risk_level = "MODERATE"
    elif composite_score <= high_max:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    # HOTSPOT DETECTION
    # Overlapping triggers: High rainfall + steep slope (>30°) + significant historical activity
    is_hotspot = (rainfall_level == "HIGH" and slope_deg >= 30.0 and historical_factor >= 50.0) or (composite_score >= 76.0)

    # EXPLAINABLE RISK REASONING
    explanation = _generate_explanation(
        composite_score,
        risk_level,
        rainfall_level,
        slope_level,
        historical_level,
        terrain_level,
        current_rain,
        rain_72h,
        slope_deg,
        location.get("name", "Unknown Location")
    )

    assessment = {
        "location_id": location.get("id", "unknown"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "risk_score": composite_score,
        "risk_level": risk_level,
        "is_hotspot": is_hotspot,
        "explanation": explanation,
        "factors": {
            "rainfall": {
                "score": rainfall_factor,
                "level": rainfall_level,
                "current_rate_mm_h": current_rain,
                "antecedent_72h_mm": rain_72h,
                "weight": w_rain
            },
            "slope": {
                "score": slope_factor,
                "level": slope_level,
                "degrees": slope_deg,
                "weight": w_slope
            },
            "historical": {
                "score": historical_factor,
                "level": historical_level,
                "nearest_slide_km": round(nearest_dist_km, 1) if nearest_dist_km < 900 else None,
                "weight": w_hist
            },
            "terrain": {
                "score": terrain_factor,
                "level": terrain_level,
                "ruggedness_index": tri,
                "elevation_m": elevation,
                "weight": w_terr
            }
        }
    }

    # Store in database if Supabase is active
    _store_risk_in_db(assessment)

    return assessment

def _generate_explanation(
    score: float,
    level: str,
    rain_lvl: str,
    slope_lvl: str,
    hist_lvl: str,
    terr_lvl: str,
    current_rain: float,
    rain_72h: float,
    slope_deg: float,
    loc_name: str
) -> str:
    """Generates an honest, deterministic, and scientifically grounded explanation."""
    reasons = []
    if rain_lvl == "HIGH":
        reasons.append(f"heavy precipitation (72h accumulation of {rain_72h:.1f} mm, currently {current_rain:.1f} mm/h) saturating pore-water pressure")
    elif rain_lvl == "MEDIUM":
        reasons.append(f"moderate rain infiltration ({rain_72h:.1f} mm 72h total)")

    if slope_lvl in ("HIGH", "MEDIUM"):
        reasons.append(f"steep hillside slope gradient of {slope_deg:.1f}°")

    if hist_lvl == "HIGH":
        reasons.append("immediate proximity to prior verified landslide scars")
    elif hist_lvl == "MEDIUM":
        reasons.append("recorded historical failure activity along the regional corridor")

    if not reasons:
        return f"Risk is currently {level} ({score}/100) with stable slope conditions and normal rainfall levels."

    return f"Risk is {level} ({score}/100) driven by {', combined with '.join(reasons)}. Slope shear strength is compromised by moisture saturation."

def _store_risk_in_db(assessment: Dict[str, Any]):
    try:
        sb = get_supabase_client()
        if sb and assessment.get("location_id") and assessment["location_id"] != "unknown":
            factors = assessment.get("factors", {})
            sb.table("risk_assessments").insert({
                "location_id": assessment["location_id"],
                "timestamp": assessment["timestamp"],
                "rainfall_score": factors.get("rainfall", {}).get("score", 0.0),
                "slope_score": factors.get("slope", {}).get("score", 0.0),
                "terrain_score": factors.get("terrain", {}).get("score", 0.0),
                "historical_score": factors.get("historical", {}).get("score", 0.0),
                "risk_score": assessment["risk_score"],
                "risk_level": assessment["risk_level"],
                "is_hotspot": assessment["is_hotspot"],
                "explanation": assessment["explanation"]
            }).execute()
    except Exception as exc:
        logger.debug(f"Non-critical: Supabase risk assessment insert skipped: {exc}")
