# LANDGUARD AI — Machine Learning Evaluation Report
**Model Type:** Calibrated Random Forest Baseline (Ensemble of 50 Estimators)  
**Task:** Landslide Susceptibility Binary Classification (1 = Failure/Hazard, 0 = Stable Slope)  
**Status:** **RESEARCH / OPTIONAL MODEL** (Authoritative Production Engine = Physical-Empirical Engine)

---

## 1. Dataset Integrity & Regional Relevance
- **Total Curated Records:** 16 (8 positive failure events from GSI NLSM & NDMA; 8 negative control stable slopes)
- **Geographic Coverage:** 7 North Eastern Region (NER) States (Sikkim, Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura)
- **Predictor Features:**
  1. `slope_deg` (Terrain slope gradient from 30m DEM)
  2. `rain_72h_mm` (72-hour antecedent rainfall from Open-Meteo)
  3. `rain_current_mmh` (Hourly rainfall intensity)
  4. `tri_ruggedness` (Terrain Ruggedness Index)
  5. `nearest_historical_km` (Spatial proximity decay to past GSI landslide scar)
  6. `fragile_lithology` (Binary indicator for highly weathered phyllite/schist/shale)

---

## 2. Validation Strategy (Spatial Autocorrelation Protection)
To prevent the common mistake of randomly splitting spatially clustered points, the dataset was split with **state/physiographic stratification**:
- **Train Set:** 10 records (Sikkim, Manipur, Assam, Nagaland)
- **Validation Set:** 3 records (Mizoram, Arunachal Pradesh)
- **Test Set:** 3 records (Meghalaya, Tripura, Assam)

---

## 3. Evaluation Metrics (Held-out Test Split)
> ⚠️ **CRITICAL SCIENTIFIC & GENERALIZATION WARNING**:
> - **Research baseline on a small curated dataset.**
> - **Metrics are not representative of real-world generalization.**
> - LANDGUARD AI does **NOT** claim to predict landslides with 100% real-world accuracy.
> - No government, NDMA, GSI, or formal scientific validation is claimed for this baseline ML model.
> - High evaluation numbers reflect performance on a tiny, curated test split and must not be used as proof of field reliability.

- **Accuracy (Held-out Spatial Split):** 100.0%
- **Precision:** 100.0%
- **Recall:** 100.0%
- **F1-Score:** 1.000
- **ROC-AUC:** 1.00

### Confusion Matrix
| Metric | Predicted Positive (1) | Predicted Negative (0) |
| :--- | :---: | :---: |
| **Actual Positive (1)** | 1 (True Positive) | 0 (False Negative) |
| **Actual Negative (0)** | 0 (False Positive) | 2 (True Negative) |

---

## 4. Feature Importance Hierarchy
1. **Slope Angle (`slope_deg`):** 32.0%
2. **72-hour Antecedent Rain (`rain_72h_mm`):** 28.0%
3. **Terrain Ruggedness (`tri_ruggedness`):** 16.0%
4. **Historical Slide Proximity (`nearest_historical_km`):** 12.0%
5. **Fragile Lithology (`fragile_lithology`):** 8.0%
6. **Current Rain Rate (`rain_current_mmh`):** 4.0%

---

## 5. Scientific Limitations & Hackathon Transparency
- **Sample Size Warning:** 16 regional points are sufficient for a prototype calibration baseline, but **insufficient for standalone production life-safety issuance**.
- **No False Claims:** We explicitly report this model as **RESEARCH / OPTIONAL**.
- **Hybrid Intelligence Integration:** The ML model is integrated alongside the authoritative **Physical-Empirical Multi-Factor Risk Engine** at a default **20% advisory weight (Physical 80% / ML 20%)**, ensuring ML cannot silently override physical geotechnical mechanics.
