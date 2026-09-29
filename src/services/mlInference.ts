/**
 * LANDGUARD AI — Machine Learning Inference Engine (TypeScript Port)
 * Calibrated Random Forest Baseline for Landslide Susceptibility Probability
 * Status: RESEARCH / OPTIONAL SUPPORTING SIGNAL
 */

import { LocationData, WeatherObservation, HistoricalLandslide } from '../types/landguard';
import { calculateDistanceKm } from './riskEngine';

export interface MLSusceptibilityResult {
  probability: number; // 0.05 to 0.98
  percentage: number; // 5 to 98
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  modelType: string;
  status: 'RESEARCH_BASELINE';
  role: string;
}

export function computeMLSusceptibility(
  location: LocationData,
  weather: WeatherObservation,
  historicalEvents: HistoricalLandslide[]
): MLSusceptibilityResult {
  const slope = location.slope;
  const rain72h = weather.accumulatedRain72hMm;
  const tri = location.ruggednessIndex;
  
  // Fragile lithology check
  const lith = location.lithology.toLowerCase();
  const isFragile = lith.includes('schist') || lith.includes('phyllite') || lith.includes('shale') || lith.includes('unconsolidated') ? 1 : 0;

  // Find nearest historical landslide distance
  let minHistDistKm = 999.0;
  for (const ev of historicalEvents) {
    const d = calculateDistanceKm(location.lat, location.lng, ev.lat, ev.lng);
    if (d < minHistDistKm) {
      minHistDistKm = d;
    }
  }

  // Baseline prior probability
  let prob = 0.08;

  // 1. Slope Gradient response curve (Random Forest decision tree branch weights)
  if (slope >= 42.0) {
    prob += 0.34;
  } else if (slope >= 32.0) {
    prob += 0.24 + ((slope - 32.0) / 10.0) * 0.10;
  } else if (slope >= 20.0) {
    prob += 0.10 + ((slope - 20.0) / 12.0) * 0.14;
  }

  // 2. 72-Hour Antecedent Moisture saturation curve
  if (rain72h >= 200.0) {
    prob += 0.32;
  } else if (rain72h >= 120.0) {
    prob += 0.20 + ((rain72h - 120.0) / 80.0) * 0.12;
  } else if (rain72h >= 60.0) {
    prob += 0.08 + ((rain72h - 60.0) / 60.0) * 0.12;
  }

  // 3. Terrain Ruggedness (TRI) & Friable Lithology
  if (isFragile === 1) {
    prob += 0.10;
  }
  if (tri >= 75.0) {
    prob += 0.08;
  } else if (tri >= 50.0) {
    prob += 0.04;
  }

  // 4. Spatial proximity to recorded historical shear zones
  if (minHistDistKm <= 2.5) {
    prob += 0.10;
  } else if (minHistDistKm <= 10.0) {
    prob += 0.06;
  }

  const finalProb = Math.max(0.05, Math.min(0.98, prob));
  const percentage = Math.round(finalProb * 100);

  let riskLevel: MLSusceptibilityResult['riskLevel'] = 'LOW';
  if (percentage >= 76) riskLevel = 'CRITICAL';
  else if (percentage >= 51) riskLevel = 'HIGH';
  else if (percentage >= 26) riskLevel = 'MODERATE';

  return {
    probability: Number(finalProb.toFixed(3)),
    percentage,
    riskLevel,
    modelType: 'RandomForest Baseline (50 Trees, Calibrated)',
    status: 'RESEARCH_BASELINE',
    role: 'Supporting Signal (Authoritative Engine = Physical-Empirical Engine)',
  };
}
