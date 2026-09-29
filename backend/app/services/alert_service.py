import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.app.database import get_supabase_client

logger = logging.getLogger("landguard.alerts")

# Cache to prevent duplicate alert spam on identical cycles: location_id -> last_risk_level
_ACTIVE_ALERTS_CACHE: Dict[str, Dict[str, Any]] = {}

def evaluate_and_create_alert(
    location: Dict[str, Any],
    risk_assessment: Dict[str, Any],
    nearby_infrastructure: Optional[List[Dict[str, Any]]] = None
) -> Optional[Dict[str, Any]]:
    """
    Evaluates risk score thresholds (51 -> HIGH, 76 -> CRITICAL).
    Emits an operational decision-support alert while preventing redundant duplicate spam.
    
    CRITICAL PRINCIPLE:
    This provides decision support for authorities (DEOC, SDRF, BRO, PWD).
    It does NOT automatically order mandatory evacuations.
    """
    loc_id = location.get("id", "unknown")
    score = float(risk_assessment.get("risk_score", 0.0))
    level = risk_assessment.get("risk_level", "LOW")

    # Threshold check: Alert is triggered ONLY for HIGH (51-75) or CRITICAL (76-100)
    if score < 51.0:
        # If location recovered below 51, mark any previous alert as resolved
        if loc_id in _ACTIVE_ALERTS_CACHE:
            _resolve_alert(loc_id)
        return None

    # De-duplicate: If already active at the SAME risk level, update timestamp without spamming duplicate records
    cached = _ACTIVE_ALERTS_CACHE.get(loc_id)
    if cached and cached.get("risk_level") == level:
        cached["updated_at"] = datetime.now(timezone.utc).isoformat()
        return cached

    # Summarize nearby infrastructure exposure
    infra_list = nearby_infrastructure or []
    schools = sum(1 for i in infra_list if i.get("type") == "school")
    hospitals = sum(1 for i in infra_list if i.get("type") == "hospital")
    settlements = sum(1 for i in infra_list if i.get("type") == "settlement")
    roads = sum(1 for i in infra_list if i.get("type") in ("road", "bridge", "railway"))

    # Craft structured decision-support alert message
    factors = risk_assessment.get("factors", {})
    rain_lvl = factors.get("rainfall", {}).get("level", "MODERATE")
    slope_lvl = factors.get("slope", {}).get("level", "MODERATE")
    
    recommendation = (
        "Increase geotechnical and drainage patrol frequency. Review culvert clearances along arterial transit corridors. "
        "Alert local disaster response teams (SDRF/QRT) for rapid response readiness."
        if level == "HIGH" else
        "Intensify continuous slope displacement telemetry. Restrict heavy transit across vulnerable cut-sections. "
        "Coordinate with District Emergency Operation Centre (DEOC) and verify shelter logistics."
    )

    alert_message = (
        f"{level} LANDSLIDE RISK BULLETIN\n"
        f"Sector: {location.get('name', 'Unknown')}, {location.get('district', '')} ({location.get('state', '')})\n"
        f"Composite Risk Score: {score}/100 ({level})\n"
        f"Primary Triggers: {rain_lvl} Rainfall / {slope_lvl} Slope Gradient\n"
        f"Exposed Lifeline Assets: {schools} school(s), {hospitals} hospital(s), {settlements} settlement(s), {roads} road/rail link(s)\n"
        f"Decision Support Recommendation: {recommendation}"
    )

    alert_obj = {
        "location_id": loc_id,
        "location_name": location.get("name", "Unknown"),
        "state": location.get("state", ""),
        "district": location.get("district", ""),
        "risk_score": score,
        "risk_level": level,
        "message": alert_message,
        "recommendation": recommendation,
        "nearby_summary": {
            "schools": schools,
            "hospitals": hospitals,
            "settlements": settlements,
            "roads": roads
        },
        "status": "ACTIVE",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    _ACTIVE_ALERTS_CACHE[loc_id] = alert_obj
    _store_alert_in_db(alert_obj)

    return alert_obj

def get_all_active_alerts() -> List[Dict[str, Any]]:
    """Returns currently active alerts sorted by risk severity."""
    alerts = list(_ACTIVE_ALERTS_CACHE.values())
    return sorted(alerts, key=lambda a: a.get("risk_score", 0), reverse=True)

def _resolve_alert(loc_id: str):
    alert = _ACTIVE_ALERTS_CACHE.pop(loc_id, None)
    if alert:
        alert["status"] = "RESOLVED"
        alert["updated_at"] = datetime.now(timezone.utc).isoformat()
        try:
            sb = get_supabase_client()
            if sb:
                sb.table("alerts").update({"status": "RESOLVED", "updated_at": alert["updated_at"]}).eq("location_id", loc_id).execute()
        except Exception:
            pass

def _store_alert_in_db(alert: Dict[str, Any]):
    try:
        sb = get_supabase_client()
        if sb:
            sb.table("alerts").insert({
                "location_id": alert["location_id"],
                "risk_score": alert["risk_score"],
                "risk_level": alert["risk_level"],
                "message": alert["message"],
                "status": alert["status"],
                "created_at": alert["created_at"],
                "updated_at": alert["updated_at"]
            }).execute()
    except Exception as exc:
        logger.debug(f"Non-critical: Supabase alert insert skipped: {exc}")
