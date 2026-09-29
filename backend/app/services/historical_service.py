import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("landguard.historical")

# Curated Geological Survey of India (GSI) and Disaster Management records for North East India
VERIFIED_HISTORICAL_EVENTS: List[Dict[str, Any]] = [
    {
        "id": "hist-001",
        "latitude": 24.8118,
        "longitude": 93.6552,
        "event_date": "2022-06-30",
        "location_name": "Tupul Railway Yard / Noney, Manipur",
        "state": "Manipur",
        "severity": "Catastrophic",
        "trigger": "Continuous Monsoon Rain (240mm in 48h)",
        "casualties": 61,
        "description": "Massive rotational debris slide buried Indian Army 107 Territorial Army camp and Tupul rail yard along Ijei river, impounding river flow.",
        "source": "GSI Report & Manipur SDMA Archive"
    },
    {
        "id": "hist-002",
        "latitude": 27.6042,
        "longitude": 88.6472,
        "event_date": "2023-10-04",
        "location_name": "Chungthang Dam Site / Lachen River Basin, Sikkim",
        "state": "Sikkim",
        "severity": "Catastrophic",
        "trigger": "GLOF (South Lhonak Lake) + Flash Flooding",
        "casualties": 42,
        "description": "Teesta Stage III hydroelectric dam breached by massive debris flow and boulder slurry, washing out NH-10 segments.",
        "source": "National Disaster Management Authority (NDMA)"
    },
    {
        "id": "hist-003",
        "latitude": 25.1792,
        "longitude": 93.0164,
        "event_date": "2022-05-15",
        "location_name": "New Haflong Railway Station, Dima Hasao, Assam",
        "state": "Assam",
        "severity": "Severe",
        "trigger": "Excessive Pre-Monsoon Rains",
        "casualties": 3,
        "description": "Debris flow inundated station platform and derailed passenger carriages; washed out 58 km of Lumding-Badarpur railway tracks.",
        "source": "Northeast Frontier Railway (NFR) / ASDMA"
    },
    {
        "id": "hist-004",
        "latitude": 25.6698,
        "longitude": 94.1084,
        "event_date": "2021-08-12",
        "location_name": "Phesama Sinking Zone, NH-29, Kohima, Nagaland",
        "state": "Nagaland",
        "severity": "Severe",
        "trigger": "Prolonged Infiltration & Clay Expansion",
        "casualties": 0,
        "description": "Slow-moving creep and deep-seated slip severed NH-29, cutting off Manipur trade logistics for 18 days.",
        "source": "Nagaland NSDMA Geological Cell"
    },
    {
        "id": "hist-005",
        "latitude": 23.7312,
        "longitude": 92.7115,
        "event_date": "2024-05-28",
        "location_name": "Hunthar & Melthum Sinking Sector, Aizawl, Mizoram",
        "state": "Mizoram",
        "severity": "Catastrophic",
        "trigger": "Cyclone Remal Torrential Precipitation",
        "casualties": 34,
        "description": "Multiple simultaneous slope collapses in stone quarries and urban residential fringes following Cyclone Remal rainfall.",
        "source": "Mizoram Disaster Management & Rehabilitation Dept"
    },
    {
        "id": "hist-006",
        "latitude": 27.3412,
        "longitude": 88.6145,
        "event_date": "2023-07-18",
        "location_name": "9th Mile, Gangtok-Nathula Highway (Jawaharlal Nehru Road)",
        "state": "Sikkim",
        "severity": "Severe",
        "trigger": "High Intensity Cloudburst",
        "casualties": 2,
        "description": "Debris slide blocked vehicular movement for 6 days; optical fiber and water pipelines severed.",
        "source": "Border Roads Organisation (BRO / Project Swastik)"
    },
    {
        "id": "hist-007",
        "latitude": 25.2514,
        "longitude": 91.7188,
        "event_date": "2020-06-02",
        "location_name": "Cherrapunji - Shella Escarpment, Meghalaya",
        "state": "Meghalaya",
        "severity": "Moderate",
        "trigger": "Extreme Orographic Rainfall",
        "casualties": 4,
        "description": "Sheet wash and rockfall swept across village access road, damaging power transformers.",
        "source": "Meghalaya SDMA"
    },
    {
        "id": "hist-008",
        "latitude": 27.1052,
        "longitude": 93.6384,
        "event_date": "2024-05-28",
        "location_name": "Naharlagun Hill Cut, Papum Pare, Arunachal Pradesh",
        "state": "Arunachal Pradesh",
        "severity": "Moderate",
        "trigger": "Monsoon Torrential Rain",
        "casualties": 1,
        "description": "Uncut Siwalik slope collapse buried two vehicles and breached boundary wall of local middle school.",
        "source": "Arunachal Disaster Management Dept"
    }
]

def get_historical_landslides(
    state: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Returns filtered historical landslide catalogue."""
    results = VERIFIED_HISTORICAL_EVENTS
    
    if state and state.lower() != "all":
        results = [r for r in results if r.get("state", "").lower() == state.lower()]
        
    if severity and severity.lower() != "all":
        results = [r for r in results if r.get("severity", "").lower() == severity.lower()]
        
    if start_date:
        results = [r for r in results if r.get("event_date", "") >= start_date]
        
    if end_date:
        results = [r for r in results if r.get("event_date", "") <= end_date]
        
    return results
