import {
  LocationData,
  WeatherObservation,
  HistoricalLandslide,
  RiskFactors,
  FactorBreakdown,
  FactorContribution,
  RiskLevel,
  RiskThresholdConfig,
  ImpactAssessment,
  InfrastructureItem,
  EarlyWarningAlert,
  PriorityLevel,
} from '../types/landguard';
import { DEFAULT_THRESHOLDS, getInfrastructureForLocation } from '../data/nerData';
import { computeMLSusceptibility } from './mlInference';

// Haversine formula for accurate distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function computeRainfallFactor(weather: WeatherObservation, weight: number): FactorBreakdown {
  // Antecedent 72h rainfall has 60% impact on pore-water saturation; hourly intensity has 40% impact
  // Critical Himalayan thresholds: 72h rain > 180mm is critical, current rate > 15mm/h is cloudburst
  const hourlyScore = Math.min(100, (weather.currentRainfallMm / 20) * 100);
  const accumScore = Math.min(100, (weather.accumulatedRain72hMm / 180) * 100);
  
  const score = Math.round(hourlyScore * 0.4 + accumScore * 0.6);
  let level: FactorBreakdown['level'] = 'Low';
  if (score >= 76) level = 'Critical';
  else if (score >= 51) level = 'High';
  else if (score >= 26) level = 'Moderate';

  return {
    score,
    weight,
    level,
    summary: `${weather.currentRainfallMm.toFixed(1)} mm/hr current, ${weather.accumulatedRain72hMm.toFixed(1)} mm 72-hr antecedent precipitation`,
    actualMetric: `${weather.accumulatedRain72hMm.toFixed(0)} mm (72h)`,
  };
}

export function computeSlopeFactor(location: LocationData, weight: number): FactorBreakdown {
  // Slope angles in degrees:
  // <15: gentle (<25)
  // 15-28: moderate (25-50)
  // 29-38: steep (51-75)
  // >38: precipitous / critical (76-100)
  let score = 0;
  if (location.slope < 15) {
    score = Math.round((location.slope / 15) * 25);
  } else if (location.slope <= 28) {
    score = Math.round(25 + ((location.slope - 15) / 13) * 25);
  } else if (location.slope <= 38) {
    score = Math.round(51 + ((location.slope - 28) / 10) * 24);
  } else {
    score = Math.min(100, Math.round(75 + ((location.slope - 38) / 12) * 25));
  }

  let level: FactorBreakdown['level'] = 'Low';
  if (score >= 76) level = 'Critical';
  else if (score >= 51) level = 'High';
  else if (score >= 26) level = 'Moderate';

  return {
    score,
    weight,
    level,
    summary: `${location.slope}° terrain incline with ${location.aspect} aspect orientation`,
    actualMetric: `${location.slope}° slope`,
  };
}

export function computeHistoricalFactor(
  location: LocationData,
  historicalEvents: HistoricalLandslide[],
  weight: number
): FactorBreakdown {
  // Find closest historical landslide
  let minDistance = Infinity;
  let closestEvent: HistoricalLandslide | null = null;
  let nearbyCountIn15Km = 0;

  for (const event of historicalEvents) {
    const dist = calculateDistanceKm(location.lat, location.lng, event.lat, event.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestEvent = event;
    }
    if (dist <= 15) {
      nearbyCountIn15Km++;
    }
  }

  let score = 20; // baseline low
  if (minDistance <= 2.5) {
    score = 92;
  } else if (minDistance <= 6) {
    score = 78;
  } else if (minDistance <= 15) {
    score = 58;
  } else if (minDistance <= 30) {
    score = 38;
  }

  // Add weight if multiple past occurrences exist in the corridor
  score = Math.min(100, score + Math.min(12, nearbyCountIn15Km * 3));

  let level: FactorBreakdown['level'] = 'Low';
  if (score >= 76) level = 'Critical';
  else if (score >= 51) level = 'High';
  else if (score >= 26) level = 'Moderate';

  const summary = closestEvent
    ? `Prior slide event recorded ${minDistance.toFixed(1)} km away (${closestEvent.locationName}, ${closestEvent.date.split('-')[0]})`
    : `No recorded major historical slide within 30 km radius`;

  return {
    score,
    weight,
    level,
    summary,
    actualMetric: minDistance < 50 ? `${minDistance.toFixed(1)} km away` : '>50 km away',
  };
}

export function computeTerrainFactor(location: LocationData, weight: number): FactorBreakdown {
  let lithologyFragility = 50;
  const lith = location.lithology.toLowerCase();
  if (lith.includes('schist') || lith.includes('phyllite') || lith.includes('shale') || lith.includes('swelling') || lith.includes('unconsolidated')) {
    lithologyFragility = 85;
  } else if (lith.includes('sandstone') || lith.includes('moraine')) {
    lithologyFragility = 65;
  } else if (lith.includes('granite') || lith.includes('crystalline')) {
    lithologyFragility = 40;
  }

  let vegPenalty = 50;
  if (location.vegetationCover === 'Urban/Barren Cut') vegPenalty = 90;
  else if (location.vegetationCover === 'Degraded Slopes') vegPenalty = 75;
  else if (location.vegetationCover === 'Terraced Cultivation') vegPenalty = 55;
  else if (location.vegetationCover === 'Dense Forest') vegPenalty = 30;

  const score = Math.round(
    (location.ruggednessIndex * 0.4) + (lithologyFragility * 0.35) + (vegPenalty * 0.25)
  );

  let level: FactorBreakdown['level'] = 'Low';
  if (score >= 76) level = 'Critical';
  else if (score >= 51) level = 'High';
  else if (score >= 26) level = 'Moderate';

  return {
    score,
    weight,
    level,
    summary: `${location.elevation}m elevation, ${location.lithology} with ${location.vegetationCover}`,
    actualMetric: `TRI ${location.ruggednessIndex}/100`,
  };
}

export function computeRiskAssessment(
  location: LocationData,
  weather: WeatherObservation,
  historicalEvents: HistoricalLandslide[],
  config: RiskThresholdConfig = DEFAULT_THRESHOLDS,
  previousAssessment?: { riskScore: number; rainfallMm72h: number }
): RiskFactors {
  const rainfall = computeRainfallFactor(weather, config.weights.rainfall);
  const slope = computeSlopeFactor(location, config.weights.slope);
  const historical = computeHistoricalFactor(location, historicalEvents, config.weights.historical);
  const terrain = computeTerrainFactor(location, config.weights.terrain);

  // Exact factor contributions in points (e.g. 85 * 0.35 = 29.8 pts)
  const rainfallPts = Number((rainfall.score * rainfall.weight).toFixed(1));
  const slopePts = Number((slope.score * slope.weight).toFixed(1));
  const historicalPts = Number((historical.score * historical.weight).toFixed(1));
  const terrainPts = Number((terrain.score * terrain.weight).toFixed(1));
  const totalPts = Number((rainfallPts + slopePts + historicalPts + terrainPts).toFixed(1));

  const compositeScore = Math.min(100, Math.max(0, Math.round(
    rainfall.score * rainfall.weight +
    slope.score * slope.weight +
    historical.score * historical.weight +
    terrain.score * terrain.weight
  )));

  let riskLevel: RiskLevel = 'LOW';
  if (compositeScore >= config.highMax + 1) {
    riskLevel = 'CRITICAL';
  } else if (compositeScore >= config.moderateMax + 1) {
    riskLevel = 'HIGH';
  } else if (compositeScore >= config.lowMax + 1) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }

  // Hotspot condition: steep slope + elevated rain + active/fragile terrain
  const isHotspot = (slope.score >= 60 && rainfall.score >= 55) || compositeScore >= 72;

  // Hybrid Intelligence: Research ML Random Forest Susceptibility Baseline
  const mlResult = computeMLSusceptibility(location, weather, historicalEvents);
  const physicalScore = compositeScore;
  const mlSusceptibility = mlResult.percentage;
  // Configurable hybrid blend: 80% physical authoritative + 20% ML advisory signal
  const hybridScore = Math.min(100, Math.max(0, Math.round(physicalScore * 0.80 + mlSusceptibility * 0.20)));

  // Temporal Delta Analysis: "Why Did Risk Change?"
  // Uses actual stored previous assessment record. If no previous record exists, do NOT fabricate!
  let prevScore: number | undefined = undefined;
  let scoreDelta: number | undefined = undefined;
  let deltaDriver: string | undefined = undefined;

  if (previousAssessment && typeof previousAssessment.riskScore === 'number') {
    prevScore = previousAssessment.riskScore;
    scoreDelta = compositeScore - prevScore;

    if (scoreDelta > 0) {
      deltaDriver = `72-hour antecedent rainfall increased from ${previousAssessment.rainfallMm72h.toFixed(0)} mm to ${weather.accumulatedRain72hMm.toFixed(0)} mm (+${scoreDelta} pts). Static factors (Slope: ${location.slope}°, Lithology: ${location.lithology.split('(')[0].trim()}) remained unchanged.`;
    } else if (scoreDelta < 0) {
      deltaDriver = `Precipitation diminished from ${previousAssessment.rainfallMm72h.toFixed(0)} mm to ${weather.accumulatedRain72hMm.toFixed(0)} mm (${scoreDelta} pts). Static terrain parameters remained unchanged.`;
    } else {
      deltaDriver = `Steady-state conditions. Meteorological conditions (${weather.accumulatedRain72hMm.toFixed(0)} mm) and static terrain parameters (${location.slope}° slope, ${location.lithology.split('(')[0].trim()}) remained unchanged.`;
    }
  }

  // Construct rigorous, factual explanation without hallucinating
  const drivers: string[] = [];
  if (rainfall.score >= 55) drivers.push(`persistent rainfall (${weather.accumulatedRain72hMm.toFixed(0)} mm 72-hr antecedent moisture)`);
  if (slope.score >= 55) drivers.push(`steep ${location.slope}° terrain incline`);
  if (historical.score >= 60) drivers.push(`active historical landslide shear zones nearby`);
  if (terrain.score >= 60) drivers.push(`friable lithology (${location.lithology.split('(')[0].trim()})`);

  let explanation = '';
  if (drivers.length > 0) {
    const joinedDrivers = drivers.join(', ');
    explanation = `${riskLevel} susceptibility is primarily driven by ${joinedDrivers}. Elevated pore-water pressures reduce slope shear resistance along colluvial strata.`;
  } else {
    explanation = `Low risk profile supported by stable underlying bedrock, moderate slope angle (${location.slope}°), and low cumulative rainfall (${weather.accumulatedRain72hMm.toFixed(0)} mm).`;
  }

  return {
    rainfall,
    slope,
    historical,
    terrain,
    compositeScore,
    riskLevel,
    explanation,
    isHotspot,
    computedAt: new Date().toISOString(),
    physicalScore,
    mlSusceptibility,
    hybridScore,
    previousScore: prevScore,
    scoreDelta,
    deltaDriver,
    contributions: {
      rainfallPts,
      slopePts,
      historicalPts,
      terrainPts,
      totalPts,
    },
  };
}

export function computeImpactAssessment(
  location: LocationData,
  risk: RiskFactors,
  radiusKm = 2.5
): ImpactAssessment {
  const allInfra = getInfrastructureForLocation(location);
  const inRadiusInfra = allInfra.filter((item) => item.distanceKm <= radiusKm);

  const schools = inRadiusInfra.filter((i) => i.type === 'school');
  const hospitals = inRadiusInfra.filter((i) => i.type === 'hospital');
  const roads = inRadiusInfra.filter((i) => i.type === 'road' || i.type === 'railway' || i.type === 'bridge');
  const settlements = inRadiusInfra.filter((i) => i.type === 'settlement');

  const totalPop = settlements.reduce((acc, curr) => acc + (curr.capacityOrPop || 0), 0);
  const schoolsCapacity = schools.reduce((acc, curr) => acc + (curr.capacityOrPop || 0), 0);
  const hospitalsCapacity = hospitals.reduce((acc, curr) => acc + (curr.capacityOrPop || 0), 0);
  const totalExposedPeople = totalPop + schoolsCapacity + hospitalsCapacity;

  // Exposure scores
  const infraScore = Math.min(100, Math.round(hospitals.length * 30 + schools.length * 20 + roads.length * 25));
  const popScore = Math.min(100, Math.round((totalExposedPeople / 3500) * 100));
  const envScore = risk.compositeScore;

  // Impact Priority Score: Environmental Risk (45%) + Infrastructure Exposure (30%) + Population Exposure (25%)
  const impactPriorityScore = Math.round(envScore * 0.45 + infraScore * 0.30 + popScore * 0.25);

  let overallPriority: PriorityLevel = 'LOW';
  if (impactPriorityScore >= 75) overallPriority = 'URGENT';
  else if (impactPriorityScore >= 55) overallPriority = 'HIGH';
  else if (impactPriorityScore >= 35) overallPriority = 'MODERATE';

  let priorityReason = '';
  if (overallPriority === 'URGENT' || overallPriority === 'HIGH') {
    priorityReason = `Elevated environmental risk (${envScore}/100) overlaps with ${settlements.length} inhabited settlements (~${totalExposedPeople} exposed individuals), ${hospitals.length} healthcare facilities, and ${roads.length} critical transport lifeline corridor(s).`;
  } else {
    priorityReason = `Moderate environmental risk with limited high-density infrastructure in the immediate ${radiusKm}km buffer zone.`;
  }

  return {
    locationId: location.id,
    locationName: location.name,
    radiusKm,
    settlementsCount: settlements.length,
    estimatedPopulation: totalExposedPeople,
    schoolsCount: schools.length,
    hospitalsCount: hospitals.length,
    majorRoadsCount: roads.length,
    infrastructureExposureScore: infraScore,
    populationExposureScore: popScore,
    environmentalRiskScore: envScore,
    impactPriorityScore,
    overallPriority,
    priorityReason,
    nearbyInfrastructure: inRadiusInfra,
  };
}

export function generateEarlyWarning(
  location: LocationData,
  risk: RiskFactors,
  impact: ImpactAssessment
): EarlyWarningAlert | undefined {
  if (risk.riskLevel === 'LOW' && impact.overallPriority === 'LOW') {
    return undefined;
  }

  const actions: string[] = [];
  if (risk.riskLevel === 'CRITICAL') {
    actions.push('Deploy SDRF / Quick Response Teams to forward staging posts along highway');
    actions.push(`Issue urgent travel advisory and regulate heavy vehicle freight on ${location.name}`);
    actions.push('Activate optical extensometer and slope sensor telemetry at high-risk scarps');
    actions.push('Inspect culverts and unblock cross-drainage channels to prevent hydrostatic buildup');
    actions.push('Alert district civil hospital and standby trauma units for contingency mass-casualty intake');
  } else if (risk.riskLevel === 'HIGH') {
    actions.push('Increase visual monitoring rounds by PWD / BRO road clearing teams');
    actions.push('Inspect toe of slopes near inhabited clusters and report micro-fissuring');
    actions.push('Distribute weather advisories and safety bulletins to local panchayats/councils');
    actions.push('Pre-position heavy earthmoving excavators (JCBs) near critical highway bottlenecks');
  } else {
    actions.push('Routine automated sensor checks and 24-hr rainfall threshold surveillance');
    actions.push('Maintain standard communication channels with State Emergency Operations Centre (SEOC)');
  }

  let triggerReason = '';
  if (risk.riskLevel === 'CRITICAL') {
    triggerReason = `Critical pore-pressure saturation: 72h antecedent rainfall of ${risk.rainfall.actualMetric} on ${location.slope}° inclined ${location.lithology.split('(')[0]}.`;
  } else if (risk.riskLevel === 'HIGH') {
    triggerReason = `High slope susceptibility combined with heavy precipitation trend and vulnerable transport corridors.`;
  } else {
    triggerReason = `Moderate rainfall accumulation over steep gradient terrain.`;
  }

  return {
    id: `alert-${location.id}-${Date.now()}`,
    locationId: location.id,
    locationName: location.name,
    state: location.state,
    riskScore: risk.compositeScore,
    severity: risk.riskLevel,
    triggerReason,
    recommendedActions: actions,
    issuedAt: new Date().toISOString(),
    status: 'ACTIVE',
    priorityRank: impact.impactPriorityScore,
  };
}
