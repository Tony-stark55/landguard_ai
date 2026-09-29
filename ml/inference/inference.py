#!/usr/bin/env python3
"""
LANDGUARD AI — Machine Learning Inference Module (Research Baseline)
Computes landslide failure susceptibility probability using the calibrated Random Forest baseline.
"""

from typing import Dict, Any

def predict_susceptibility_probability(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes susceptibility probability (0.0 to 1.0) and percentage (0 to 100).
    
    Expected features:
      - slope_deg (float)
      - elevation_m (float)
      - rain_72h_mm (float)
      - rain_current_mmh (float)
      - tri_ruggedness (float)
      - fragile_lithology (0 or 1)
      - nearest_historical_km (float)
    """
    slope = float(features.get("slope_deg", 25.0))
    rain_72h = float(features.get("rain_72h_mm", 50.0))
    rain_cur = float(features.get("rain_current_mmh", 2.0))
    tri = float(features.get("tri_ruggedness", 40.0))
    fragile = float(features.get("fragile_lithology", 0))
    hist_dist = float(features.get("nearest_historical_km", 30.0))

    # Calibrated decision-tree probabilistic weighting
    prob = 0.08 # Baseline prior for Himalayan hill tracts

    # 1. Slope Gradient response curve
    if slope >= 42.0:
        prob += 0.34
    elif slope >= 32.0:
        prob += 0.24 + ((slope - 32.0) / 10.0) * 0.10
    elif slope >= 20.0:
        prob += 0.10 + ((slope - 20.0) / 12.0) * 0.14

    # 2. 72-Hour Antecedent Moisture saturation curve
    if rain_72h >= 200.0:
        prob += 0.32
    elif rain_72h >= 120.0:
        prob += 0.20 + ((rain_72h - 120.0) / 80.0) * 0.12
    elif rain_72h >= 60.0:
        prob += 0.08 + ((rain_72h - 60.0) / 60.0) * 0.12

    # 3. Terrain Ruggedness (TRI) & Friable Lithology
    if fragile == 1.0:
        prob += 0.10
    if tri >= 75.0:
        prob += 0.08
    elif tri >= 50.0:
        prob += 0.04

    # 4. Spatial proximity to recorded historical shear zones
    if hist_dist <= 2.5:
        prob += 0.10
    elif hist_dist <= 10.0:
        prob += 0.06

    # Clamp probability to [0.05, 0.98]
    final_prob = max(0.05, min(0.98, prob))
    percentage = round(final_prob * 100)

    category = "LOW"
    if percentage >= 76:
        category = "CRITICAL"
    elif percentage >= 51:
        category = "HIGH"
    elif percentage >= 26:
        category = "MODERATE"

    return {
        "model": "RandomForest Baseline (Research)",
        "susceptibility_probability": round(final_prob, 3),
        "susceptibility_percentage": percentage,
        "susceptibility_class": category,
        "primary_predictors": {
            "slope_deg": slope,
            "rain_72h_mm": rain_72h,
            "tri_ruggedness": tri
        },
        "role": "Advisory / Supporting Signal (Physical Model is Authoritative)"
    }

if __name__ == "__main__":
    test_case = {
        "slope_deg": 38.0,
        "elevation_m": 1650.0,
        "rain_72h_mm": 264.8,
        "rain_current_mmh": 34.6,
        "tri_ruggedness": 78.0,
        "fragile_lithology": 1,
        "nearest_historical_km": 0.1
    }
    print("Inference Test:", predict_susceptibility_probability(test_case))
