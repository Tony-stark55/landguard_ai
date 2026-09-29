/**
 * LANDGUARD AI Types & Interfaces
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';

export interface LocationData {
  id: string;
  name: string;
  district: string;
  state: 'Sikkim' | 'Assam' | 'Meghalaya' | 'Arunachal Pradesh' | 'Nagaland' | 'Manipur' | 'Mizoram' | 'Tripura';
  lat: number;
  lng: number;
  elevation: number; // meters
  slope: number; // degrees
  aspect: string; // N, NE, E, SE, S, SW, W, NW
  ruggednessIndex: number; // 0-100
  lithology: string; // e.g. Weathered Schist & Gneiss, Daling Series
  vegetationCover: 'Dense Forest' | 'Degraded Slopes' | 'Terraced Cultivation' | 'Urban/Barren Cut' | 'Barren Cut / Plateau Edge';
}

export interface WeatherObservation {
  locationId: string;
  timestamp: string;
  currentRainfallMm: number; // mm/hr
  accumulatedRain72hMm: number; // mm in last 3 days
  tempC: number;
  humidityPercent: number;
  forecastRain24hMm: number;
  windSpeedKmh: number;
  weatherDescription: string;
  isRealApi: boolean;
  source: string;
}

export interface FactorBreakdown {
  score: number; // 0-100
  weight: number; // e.g. 0.35
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  summary: string;
  actualMetric: string;
}

export interface FactorContribution {
  rainfallPts: number;
  slopePts: number;
  historicalPts: number;
  terrainPts: number;
  totalPts: number;
}

export interface RiskFactors {
  rainfall: FactorBreakdown;
  slope: FactorBreakdown;
  historical: FactorBreakdown;
  terrain: FactorBreakdown;
  compositeScore: number; // 0-100 (Authoritative Physical Risk Score)
  riskLevel: RiskLevel;
  explanation: string;
  isHotspot: boolean;
  computedAt: string;
  // Hybrid Intelligence & Explainability fields
  physicalScore: number; // 0-100 (Physical-Empirical Multi-Factor Score)
  mlSusceptibility: number; // 0-100 (Random Forest Susceptibility Probability)
  hybridScore: number; // 0-100 (Configurable Hybrid Decision-Support Score)
  previousScore?: number; // Previous cycle risk score
  scoreDelta?: number; // Delta from previous assessment (e.g. +22)
  deltaDriver?: string; // Detailed text identifying largest contributing factor change
  contributions: FactorContribution;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'settlement' | 'road' | 'bridge' | 'railway';
  lat: number;
  lng: number;
  distanceKm: number;
  capacityOrPop?: number;
  details: string;
}

export interface ImpactAssessment {
  locationId: string;
  locationName: string;
  radiusKm: number;
  settlementsCount: number;
  estimatedPopulation: number;
  schoolsCount: number;
  hospitalsCount: number;
  majorRoadsCount: number;
  infrastructureExposureScore: number; // 0-100
  populationExposureScore: number; // 0-100
  environmentalRiskScore: number; // 0-100
  impactPriorityScore: number; // 0-100
  overallPriority: PriorityLevel;
  priorityReason: string;
  nearbyInfrastructure: InfrastructureItem[];
}

export interface EarlyWarningAlert {
  id: string;
  locationId: string;
  locationName: string;
  state: string;
  riskScore: number;
  severity: RiskLevel;
  triggerReason: string;
  recommendedActions: string[];
  issuedAt: string;
  status: 'ACTIVE' | 'MONITORING' | 'RESOLVED';
  priorityRank: number;
}

export interface HistoricalLandslide {
  id: string;
  date: string;
  locationName: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  trigger: 'Monsoon Torrential Rain' | 'Cloudburst' | 'Slope Toe Cut / Road Widening' | 'Pre-monsoon Squall' | 'Post-earthquake Slippage';
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic';
  casualties: number;
  damageSummary: string;
  source: string;
}

export interface SystemStats {
  activeAlerts: number;
  criticalZones: number;
  highRiskZones: number;
  moderateRiskZones: number;
  lowRiskZones: number;
  monitoredLocations: number;
  lastSyncTime: string;
  isDemoActive: boolean;
  liveApiStatus: 'online' | 'degraded' | 'cached';
  activeIncidentName?: string;
  databaseStatus?: 'connected' | 'local_in_memory_persisted';
  mlModelStatus?: 'active_research_baseline' | 'deterministic_only';
}

export interface LocationFullReport {
  location: LocationData;
  weather: WeatherObservation;
  risk: RiskFactors;
  impact: ImpactAssessment;
  alert?: EarlyWarningAlert;
  historicalNearby: HistoricalLandslide[];
}

export interface RiskThresholdConfig {
  lowMax: number;
  moderateMax: number;
  highMax: number;
  weights: {
    rainfall: number;
    slope: number;
    historical: number;
    terrain: number;
  };
}

export type TimeRangeOption = '1H' | '6H' | '12H' | '24H' | '72H';

export interface TimelineDataPoint {
  timestamp: string;
  isoTime: string;
  displayTime: string;
  hoursAgo: number;
  rainfallRateMmH: number;
  rainfallAccum72hMm: number;
  rainfallFactorScore: number;
  rainfallFactorLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  slopeScore: number;
  terrainScore: number;
  historicalScore: number;
  physicalScore: number;
  mlSusceptibility: number;
  hybridScore: number;
  riskLevel: RiskLevel;
  isHotspot: boolean;
  explanation: string;
  exposedInfrastructureCount: number;
  exposedSettlementsCount: number;
  exposedPopulation: number;
  exposedSchoolsCount: number;
  exposedHospitalsCount: number;
  exposedRoadsCount: number;
  alertEscalationStatus: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY_EVACUATION';
  alertPriority: PriorityLevel;
  primaryCause: string;
}

export interface LocationTimelineReport {
  location: LocationData;
  timeRange: TimeRangeOption;
  points: TimelineDataPoint[];
  currentPointIndex: number;
  dataSources: {
    weather: string;
    terrain: string;
    historical: string;
    infrastructure: string;
    risk: string;
    ml: string;
    tiles: string;
    simulator: string;
  };
}

export type DemoPhase =
  | 'IDLE'
  | 'INCIDENT_INITIATED'
  | 'ATMOSPHERIC_INFLUX'
  | 'HEAVY_RAINFALL'
  | 'CLOUDBURST_PEAK'
  | 'CRITICAL_HOTSPOT'
  | 'PERSISTENT_SATURATION'
  | 'RECOVERY';

export interface DemoIncidentStep {
  stepIndex: number;
  phase: DemoPhase;
  phaseCategory: 'ATMOSPHERIC_INFLUX' | 'HEAVY_RAINFALL' | 'CLOUDBURST_PEAK' | 'CRITICAL_HOTSPOT' | 'PERSISTENT_SATURATION' | 'RECOVERY';
  phaseTitle: string;
  hoursAgo: number;
  rainfallRateMmH: number;
  accumulatedRain72hMm: number;
  poreWaterRatio: number; // 0 to 1.0 (soil pore pressure ratio)
  physicalRisk: number;
  mlSusceptibility: number;
  hybridScore: number;
  riskLevel: RiskLevel;
  isHotspot: boolean;
  bufferRadiusKm: number;
  alertLevel: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY_EVACUATION';
  authorityRecommendations: string[];
  citizenGuidance: string[];
  summary: string;
  scientificInsight: string;
}

export interface DemoIncidentState {
  active: boolean;
  phase: DemoPhase;
  stepIndex: number;
  totalSteps: number;
  locationId: string;
  locationName: string;
  locationState: string;
  locationDistrict: string;
  timestamp: string;
  displayTime: string;
  rainfallRateMmH: number;
  antecedentSaturationMm: number;
  poreWaterRatio: number;
  physicalRisk: number;
  mlRisk: number;
  hybridRisk: number;
  riskLevel: RiskLevel;
  hotspotActive: boolean;
  bufferRadiusKm: number;
  exposedInfrastructure: InfrastructureItem[];
  exposedCounts: {
    schools: number;
    hospitals: number;
    roads: number;
    settlements: number;
    bridges: number;
    total: number;
  };
  alertLevel: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY_EVACUATION';
  authorityRecommendations: string[];
  citizenGuidance: string[];
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 4;
  isComplete: boolean;
  phaseTitle: string;
  scientificInsight: string;
}
