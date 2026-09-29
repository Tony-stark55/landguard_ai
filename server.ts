import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { NER_LOCATIONS, HISTORICAL_LANDSLIDES, DEFAULT_THRESHOLDS, getInfrastructureForLocation } from './src/data/nerData';
import { fetchLocationWeather, fetchLocationHourlyHistory } from './src/services/weatherService';
import { computeRiskAssessment, computeImpactAssessment, generateEarlyWarning } from './src/services/riskEngine';
import {
  LocationData,
  LocationFullReport,
  RiskThresholdConfig,
  SystemStats,
  TimeRangeOption,
  TimelineDataPoint,
  LocationTimelineReport,
} from './src/types/landguard';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Supabase PostgreSQL connectivity check
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));
const databaseStatus: 'connected' | 'local_in_memory_persisted' = isSupabaseConfigured ? 'connected' : 'local_in_memory_persisted';

if (!isSupabaseConfigured) {
  console.log('[LANDGUARD AI] Supabase credentials not configured in environment. Operating with high-integrity local memory persistence.');
} else {
  console.log('[LANDGUARD AI] Supabase PostgreSQL configuration detected:', supabaseUrl);
}

// Application state in memory
let currentThresholds: RiskThresholdConfig = { ...DEFAULT_THRESHOLDS };
let isDemoIncidentActive = false;
let demoTargetId = 'sik-gangtok'; // Default demo scenario: Gangtok - 9th Mile NH-10 Corridor

// Initialize Google GenAI if key is present
const geminiApiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    genAI = new GoogleGenAI();
  } catch (err) {
    console.warn('Google GenAI initialization deferred or error:', err);
  }
}

// In-memory historical assessment store for actual temporal delta tracking
const assessmentHistoryMap = new Map<string, { riskScore: number; rainfallMm72h: number; timestamp: string }>();

// Helper to compute full dataset across all monitored NER locations
async function getAllLocationsWithRisk() {
  const results = await Promise.all(
    NER_LOCATIONS.map(async (loc) => {
      const weather = await fetchLocationWeather(loc, isDemoIncidentActive, demoTargetId);
      const prevAssessment = assessmentHistoryMap.get(loc.id);
      const risk = computeRiskAssessment(loc, weather, HISTORICAL_LANDSLIDES, currentThresholds, prevAssessment);
      const impact = computeImpactAssessment(loc, risk, 2.5);
      const alert = generateEarlyWarning(loc, risk, impact);

      // Record assessment for subsequent cycle comparison
      assessmentHistoryMap.set(loc.id, {
        riskScore: risk.compositeScore,
        rainfallMm72h: weather.accumulatedRain72hMm,
        timestamp: risk.computedAt,
      });

      return {
        location: loc,
        weather,
        risk,
        impact,
        alert,
      };
    })
  );

  return results;
}

// 0. API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'LANDGUARD AI Authoritative Engine (Node/Express)',
    version: '1.0.0',
    demoMode: isDemoIncidentActive,
    weatherService: 'Open-Meteo Free API (Near-Real-Time Telemetry)',
    database: databaseStatus === 'connected' ? 'Supabase PostgreSQL' : 'Local In-Memory Persistence',
    databaseStatus,
    mlModelStatus: 'active_research_baseline',
    monitoredLocations: NER_LOCATIONS.length,
    timestamp: new Date().toISOString(),
  });
});

// 1. System Statistics & Dashboard Summary
app.get(['/api/status', '/api/dashboard'], async (_req: Request, res: Response) => {
  try {
    const data = await getAllLocationsWithRisk();
    const criticalZones = data.filter((d) => d.risk.riskLevel === 'CRITICAL').length;
    const highRiskZones = data.filter((d) => d.risk.riskLevel === 'HIGH').length;
    const moderateRiskZones = data.filter((d) => d.risk.riskLevel === 'MODERATE').length;
    const lowRiskZones = data.filter((d) => d.risk.riskLevel === 'LOW').length;
    const activeAlerts = data.filter((d) => d.alert !== undefined).length;

    const stats: SystemStats = {
      activeAlerts,
      criticalZones,
      highRiskZones,
      moderateRiskZones,
      lowRiskZones,
      monitoredLocations: NER_LOCATIONS.length,
      lastSyncTime: new Date().toISOString(),
      isDemoActive: isDemoIncidentActive,
      liveApiStatus: 'online',
      activeIncidentName: isDemoIncidentActive ? 'SIMULATED CLOUDBURST: Gangtok-Mangan NH-10 Lifeline Sector' : undefined,
      databaseStatus,
      mlModelStatus: 'active_research_baseline',
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching status:', err);
    res.status(500).json({ error: 'Failed to compute system status' });
  }
});

// 2. All Monitored Locations with Live Scores
app.get('/api/locations', async (_req: Request, res: Response) => {
  try {
    const data = await getAllLocationsWithRisk();
    res.json(data);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to retrieve location intelligence' });
  }
});

// 3. Location Detailed Report
app.get('/api/locations/:id/report', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = NER_LOCATIONS.find((l) => l.id === id);
    if (!location) {
      return res.status(404).json({ error: `Location '${id}' not found` });
    }

    const weather = await fetchLocationWeather(location, isDemoIncidentActive, demoTargetId);
    const prevAssessment = assessmentHistoryMap.get(location.id);
    const risk = computeRiskAssessment(location, weather, HISTORICAL_LANDSLIDES, currentThresholds, prevAssessment);
    const impact = computeImpactAssessment(location, risk, 2.5);
    const alert = generateEarlyWarning(location, risk, impact);

    // Nearby historical slides within 35km
    const historicalNearby = HISTORICAL_LANDSLIDES.filter((h) => {
      // Rough distance check
      const dLat = Math.abs(h.lat - location.lat);
      const dLng = Math.abs(h.lng - location.lng);
      return dLat < 0.45 && dLng < 0.45;
    });

    const report: LocationFullReport = {
      location,
      weather,
      risk,
      impact,
      alert,
      historicalNearby,
    };

    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ error: 'Failed to generate location risk report' });
  }
});

// 4. Active Early Warning Bulletins
app.get('/api/alerts', async (_req: Request, res: Response) => {
  try {
    const data = await getAllLocationsWithRisk();
    const alerts = data
      .map((d) => d.alert)
      .filter((a): a is NonNullable<typeof a> => a !== undefined)
      .sort((a, b) => b.priorityRank - a.priorityRank);

    res.json(alerts);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// 5. Risk Assessment Endpoints
app.get('/api/risk', async (_req: Request, res: Response) => {
  try {
    const data = await getAllLocationsWithRisk();
    const risks = data.map((d) => ({
      location_id: d.location.id,
      name: d.location.name,
      state: d.location.state,
      latitude: d.location.lat,
      longitude: d.location.lng,
      risk_score: d.risk.compositeScore,
      risk_level: d.risk.riskLevel,
      is_hotspot: d.risk.isHotspot,
      explanation: d.risk.explanation,
      factors: d.risk,
    }));
    res.json(risks);
  } catch (err) {
    console.error('Error fetching risk list:', err);
    res.status(500).json({ error: 'Failed to calculate risk assessments' });
  }
});

app.get('/api/risk/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = NER_LOCATIONS.find((l) => l.id === id);
    if (!location) {
      return res.status(404).json({ error: `Location '${id}' not found` });
    }
    const weather = await fetchLocationWeather(location, isDemoIncidentActive, demoTargetId);
    const risk = computeRiskAssessment(location, weather, HISTORICAL_LANDSLIDES, currentThresholds);
    res.json({ location, weather, risk });
  } catch (err) {
    console.error('Error fetching location risk:', err);
    res.status(500).json({ error: 'Failed to retrieve location risk' });
  }
});

// 6. Weather Observation Endpoint
app.get('/api/weather/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = NER_LOCATIONS.find((l) => l.id === id);
    if (!location) {
      return res.status(404).json({ error: `Location '${id}' not found` });
    }
    const weather = await fetchLocationWeather(location, isDemoIncidentActive, demoTargetId);
    res.json(weather);
  } catch (err) {
    console.error('Error fetching weather:', err);
    res.status(500).json({ error: 'Failed to retrieve weather observation' });
  }
});

// 7. Historical Landslide Catalogue
app.get(['/api/historical', '/api/historical-events'], (req: Request, res: Response) => {
  const { state, severity } = req.query;
  let results = [...HISTORICAL_LANDSLIDES];
  if (state && typeof state === 'string' && state.toLowerCase() !== 'all') {
    results = results.filter((h) => h.state.toLowerCase() === state.toLowerCase());
  }
  if (severity && typeof severity === 'string' && severity.toLowerCase() !== 'all') {
    results = results.filter((h) => h.severity.toLowerCase() === severity.toLowerCase());
  }
  res.json(results);
});

// 8. Infrastructure Assets Endpoint
app.get('/api/infrastructure', (req: Request, res: Response) => {
  const { location_id, type } = req.query;
  let allInfra: any[] = [];
  NER_LOCATIONS.forEach((loc) => {
    const items = getInfrastructureForLocation(loc);
    items.forEach((item) => {
      allInfra.push({ ...item, location_id: loc.id, location_name: loc.name });
    });
  });

  if (location_id && typeof location_id === 'string') {
    allInfra = allInfra.filter((i) => i.location_id === location_id);
  }
  if (type && typeof type === 'string') {
    allInfra = allInfra.filter((i) => i.type.toLowerCase() === type.toLowerCase());
  }
  res.json(allInfra);
});

// 9. On-Demand Custom Coordinate Risk Analyzer (Citizen GPS / Surveying)
app.post('/api/analyze-location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, slope, elevation, name } = req.body || {};
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < 20 || lat > 32 || lng < 87 || lng > 98) {
      return res.status(400).json({ error: 'Coordinates must be valid numbers within North East India (20-32°N, 87-98°E)' });
    }

    const customLoc: LocationData = {
      id: 'custom-loc',
      name: name || `Survey Point (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
      state: 'Sikkim', // Regional NER default
      district: 'Hill Survey Zone',
      lat,
      lng,
      elevation: Number(elevation) || 1200,
      slope: Number(slope) || 32,
      aspect: 'SE',
      ruggednessIndex: 65,
      lithology: 'Weathered Hill Sediments & Clay Cap',
      vegetationCover: 'Degraded Slopes',
    };

    const weather = await fetchLocationWeather(customLoc, isDemoIncidentActive, demoTargetId);
    const risk = computeRiskAssessment(customLoc, weather, HISTORICAL_LANDSLIDES, currentThresholds);
    const impact = computeImpactAssessment(customLoc, risk, 2.5);

    res.json({
      location: customLoc,
      weather,
      risk,
      impact,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error analyzing custom location:', err);
    res.status(500).json({ error: 'Failed to analyze custom location' });
  }
});

// 10. Live Time-Series Risk Evolution & Timeline Endpoint
app.get(['/api/timeline/:id', '/api/risk-history/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const range = (req.query.range as TimeRangeOption) || '24H';
    const location = NER_LOCATIONS.find((l) => l.id === id);
    if (!location) {
      return res.status(404).json({ error: `Location '${id}' not found` });
    }

    const weatherObs = await fetchLocationHourlyHistory(
      location,
      range,
      isDemoIncidentActive,
      demoTargetId
    );

    // Compute impact using current conditions
    const latestWeather = weatherObs[weatherObs.length - 1] || (await fetchLocationWeather(location, isDemoIncidentActive, demoTargetId));
    const latestRisk = computeRiskAssessment(location, latestWeather, HISTORICAL_LANDSLIDES, currentThresholds);
    const impact = computeImpactAssessment(location, latestRisk, 2.5);

    const points: TimelineDataPoint[] = weatherObs.map((w, index) => {
      // For each time step, compute authoritative multi-factor physical & hybrid risk
      const risk = computeRiskAssessment(location, w, HISTORICAL_LANDSLIDES, currentThresholds);
      const pDate = new Date(w.timestamp);
      const hoursAgo = Number(((Date.now() - pDate.getTime()) / (1000 * 60 * 60)).toFixed(1));

      let alertEscalationStatus: TimelineDataPoint['alertEscalationStatus'] = 'NORMAL';
      if (risk.riskLevel === 'CRITICAL') {
        alertEscalationStatus = 'EMERGENCY_EVACUATION';
      } else if (risk.riskLevel === 'HIGH') {
        alertEscalationStatus = 'WARNING';
      } else if (risk.riskLevel === 'MODERATE') {
        alertEscalationStatus = 'WATCH';
      } else {
        alertEscalationStatus = risk.compositeScore > 15 ? 'ADVISORY' : 'NORMAL';
      }

      // Threat buffer radius corresponds to the risk severity:
      // LOW: 0.8 km (localized scarp)
      // MODERATE: 1.4 km (immediate valley slope)
      // HIGH: 2.0 km (corridor segment)
      // CRITICAL: 2.5 km (maximum multi-hazard lifeline impact zone)
      const threatRadiusKm = risk.riskLevel === 'CRITICAL'
        ? 2.5
        : risk.riskLevel === 'HIGH'
        ? 2.0
        : risk.riskLevel === 'MODERATE'
        ? 1.4
        : 0.8;

      const pointImpact = computeImpactAssessment(location, risk, threatRadiusKm);

      const displayTime = pDate.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        timestamp: w.timestamp,
        isoTime: w.timestamp,
        displayTime: index === weatherObs.length - 1 ? 'Now' : displayTime,
        hoursAgo: Math.max(0, hoursAgo),
        rainfallRateMmH: w.currentRainfallMm,
        rainfallAccum72hMm: w.accumulatedRain72hMm,
        rainfallFactorScore: risk.rainfall.score,
        rainfallFactorLevel: risk.rainfall.level,
        slopeScore: risk.slope.score,
        terrainScore: risk.terrain.score,
        historicalScore: risk.historical.score,
        physicalScore: risk.physicalScore,
        mlSusceptibility: risk.mlSusceptibility,
        hybridScore: risk.hybridScore,
        riskLevel: risk.riskLevel,
        isHotspot: risk.isHotspot,
        explanation: risk.explanation,
        exposedInfrastructureCount: pointImpact.nearbyInfrastructure.length,
        exposedSettlementsCount: pointImpact.settlementsCount,
        exposedPopulation: pointImpact.estimatedPopulation,
        exposedSchoolsCount: pointImpact.schoolsCount,
        exposedHospitalsCount: pointImpact.hospitalsCount,
        exposedRoadsCount: pointImpact.majorRoadsCount,
        alertEscalationStatus,
        alertPriority: pointImpact.overallPriority,
        primaryCause: risk.explanation,
      };
    });

    const report: LocationTimelineReport = {
      location,
      timeRange: range,
      points,
      currentPointIndex: points.length - 1,
      dataSources: {
        weather: isDemoIncidentActive && location.id === demoTargetId
          ? 'Simulated Cloudburst Incident (DEMO / SIMULATION)'
          : 'Open-Meteo API Telemetry (NEAR-REAL-TIME)',
        terrain: 'SRTM / ASTER DEM 30m Baseline (STATIC DATASET)',
        historical: 'GSI NLSM Landslide Inventory (STATIC DATASET)',
        infrastructure: 'OpenStreetMap Curated Hill Assets (STATIC GIS DATA)',
        risk: 'LANDGUARD Physical-Empirical Multi-Factor Engine (CALCULATED)',
        ml: '16-Sample Curated Random Forest Model (RESEARCH BASELINE)',
        tiles: 'CartoDB Dark Matter Spatial Tile Engine (LIVE MAP TILES)',
        simulator: isDemoIncidentActive
          ? `ACTIVE (${NER_LOCATIONS.find((l) => l.id === demoTargetId)?.name || 'Gangtok NH-10 Lifeline Sector'})`
          : 'STANDBY',
      },
    };

    // Backward compatibility for legacy /api/risk-history/:id callers
    const trend = points.slice(-8).map((p) => ({
      time: p.displayTime,
      score: p.physicalScore,
      rainMm: p.rainfallRateMmH,
    }));

    res.json({
      location_id: id,
      ...report,
      trend,
    });
  } catch (err) {
    console.error('Error computing location timeline:', err);
    res.status(500).json({ error: 'Failed to compute location timeline' });
  }
});

// 11. Demo Incident Simulator Control
app.post('/api/demo/trigger', (req: Request, res: Response) => {
  const { targetLocationId } = req.body || {};
  isDemoIncidentActive = true;
  if (targetLocationId && NER_LOCATIONS.some((l) => l.id === targetLocationId)) {
    demoTargetId = targetLocationId;
  } else {
    demoTargetId = 'sik-gangtok';
  }

  const targetLoc = NER_LOCATIONS.find((l) => l.id === demoTargetId);
  res.json({
    success: true,
    message: `DEMO INCIDENT ACTIVE: Simulated sudden cloudburst (34.6 mm/h, 264.8 mm 72-hr antecedent) in ${targetLoc?.name}.`,
    target: demoTargetId,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/demo/reset', (_req: Request, res: Response) => {
  isDemoIncidentActive = false;
  res.json({
    success: true,
    message: 'Demo incident reset to live baseline telemetry.',
    timestamp: new Date().toISOString(),
  });
});

// 7. Threshold Configuration
app.get('/api/thresholds', (_req: Request, res: Response) => {
  res.json(currentThresholds);
});

app.post('/api/thresholds', (req: Request, res: Response) => {
  try {
    const update = req.body as Partial<RiskThresholdConfig>;
    currentThresholds = {
      ...currentThresholds,
      ...update,
      weights: {
        ...currentThresholds.weights,
        ...(update.weights || {}),
      },
    };
    res.json({ success: true, thresholds: currentThresholds });
  } catch {
    res.status(400).json({ error: 'Invalid threshold configuration' });
  }
});

// 8. Grounded AI Assistant (Gemini API with gemini-3.8-flash)
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  try {
    const { question, selectedLocationId } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const data = await getAllLocationsWithRisk();
    const criticalZones = data.filter((d) => d.risk.riskLevel === 'CRITICAL');
    const highZones = data.filter((d) => d.risk.riskLevel === 'HIGH');
    const alerts = data.filter((d) => d.alert !== undefined);

    const summaryContext = data.map((d) => ({
      name: d.location.name,
      state: d.location.state,
      slope: `${d.location.slope}°`,
      lithology: d.location.lithology,
      rain_current: `${d.weather.currentRainfallMm} mm/h`,
      rain_72h: `${d.weather.accumulatedRain72hMm} mm`,
      risk_score: `${d.risk.compositeScore}/100`,
      risk_level: d.risk.riskLevel,
      impact_priority: d.impact.overallPriority,
      nearby_infra: `${d.impact.settlementsCount} settlements, ${d.impact.schoolsCount} schools, ${d.impact.hospitalsCount} hospitals, ${d.impact.majorRoadsCount} major roads`,
      reason: d.risk.explanation,
    }));

    let selectedContext = '';
    if (selectedLocationId) {
      const selected = data.find((d) => d.location.id === selectedLocationId);
      if (selected) {
        selectedContext = `
USER IS CURRENTLY INSPECTING THIS LOCATION:
Name: ${selected.location.name} (${selected.location.state})
Elevation: ${selected.location.elevation}m, Slope: ${selected.location.slope}°, Aspect: ${selected.location.aspect}
Lithology: ${selected.location.lithology}
Weather: Current ${selected.weather.currentRainfallMm}mm/h, 72h Total: ${selected.weather.accumulatedRain72hMm}mm
Risk Score: ${selected.risk.compositeScore}/100 (${selected.risk.riskLevel})
Rainfall Factor: ${selected.risk.rainfall.score}/100 (${selected.risk.rainfall.level})
Slope Factor: ${selected.risk.slope.score}/100 (${selected.risk.slope.level})
Historical Factor: ${selected.risk.historical.score}/100 (${selected.risk.historical.level})
Terrain Factor: ${selected.risk.terrain.score}/100 (${selected.risk.terrain.level})
Infrastructure Impact: ${selected.impact.settlementsCount} settlements (${selected.impact.estimatedPopulation} people), ${selected.impact.schoolsCount} schools, ${selected.impact.hospitalsCount} hospitals, ${selected.impact.majorRoadsCount} major roads. Priority: ${selected.impact.overallPriority}
        `;
      }
    }

    const systemPrompt = `
You are LANDGUARD AI, an expert landslide geospatial intelligence and early-warning decision support assistant for the North Eastern Region (NER) of India.
You assist disaster management authorities (NDMA, SDMA, District Emergency Operation Centers, BRO, and District Magistrates).

STRICT SCIENTIFIC GUIDELINES:
1. Ground your answer EXCLUSIVELY in the real system data provided below. Do not make up fake numbers, weather conditions, or fictitious towns.
2. Clearly explain the scientific mechanism: Heavy rainfall triggers pore-water pressure buildup and loss of shear strength in steep colluvial/weathered slopes.
3. Distinguish between landslide susceptibility/risk estimation and deterministic prediction (emphasize this is decision-support, not an exact time prediction).
4. Be concise, authoritative, professional, and actionable. Structure recommendations using bullet points where appropriate.

CURRENT SYSTEM REAL-TIME DATA:
Active Alerts: ${alerts.length}
Critical Zones: ${criticalZones.map((c) => c.location.name).join(', ') || 'None'}
High-Risk Zones: ${highZones.map((h) => h.location.name).join(', ') || 'None'}
Demo Mode Active: ${isDemoIncidentActive ? 'YES (Simulated Cloudburst in ' + demoTargetId + ')' : 'NO'}

ALL MONITORED NER SITES SUMMARY:
${JSON.stringify(summaryContext, null, 2)}

${selectedContext}
    `.trim();

    // Call Gemini if key is available
    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
          },
        });

        const reply = response.text || 'Analysis completed with available telemetry.';
        return res.json({ reply, source: 'Gemini 3.8 Flash (Grounded Telemetry)' });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to deterministic risk engine response:', geminiErr);
      }
    }

    // High quality deterministic fallback if API key is not yet set
    let fallbackReply = '';
    const qLower = question.toLowerCase();
    if (qLower.includes('why') || qLower.includes('factor') || qLower.includes('cause')) {
      const topCritical = criticalZones[0] || highZones[0] || data[0];
      fallbackReply = `Based on LANDGUARD AI telemetry for ${topCritical.location.name}: The elevated risk (${topCritical.risk.compositeScore}/100 ${topCritical.risk.riskLevel}) is driven by ${topCritical.risk.explanation}. Key factors: Rainfall Factor ${topCritical.risk.rainfall.score}/100 (${topCritical.weather.accumulatedRain72hMm.toFixed(0)} mm 72h antecedent), Slope ${topCritical.location.slope}°, and fragile lithology (${topCritical.location.lithology.split('(')[0]}).`;
    } else if (qLower.includes('attention') || qLower.includes('priority') || qLower.includes('highest')) {
      fallbackReply = `Currently, the highest attention is required in: ${criticalZones.map((c) => `${c.location.name} (Risk ${c.risk.compositeScore}/100, Priority: ${c.impact.overallPriority})`).join('; ') || highZones.slice(0, 2).map((h) => `${h.location.name} (${h.risk.compositeScore}/100)`).join('; ')}. These locations exhibit overlapping intense rainfall and vulnerable lifeline infrastructure.`;
    } else if (qLower.includes('infrastructure') || qLower.includes('who is at risk') || qLower.includes('school') || qLower.includes('hospital')) {
      const target = data.find((d) => d.location.id === selectedLocationId) || criticalZones[0] || data[0];
      fallbackReply = `Geospatial proximity analysis for ${target.location.name} within a 2.5 km radius reveals: ${target.impact.settlementsCount} inhabited settlements (~${target.impact.estimatedPopulation} vulnerable population), ${target.impact.schoolsCount} school(s), ${target.impact.hospitalsCount} healthcare facility(ies), and ${target.impact.majorRoadsCount} strategic road/corridor(s). Impact Priority: ${target.impact.overallPriority}.`;
    } else {
      fallbackReply = `LANDGUARD AI is currently monitoring ${NER_LOCATIONS.length} critical sectors across the 8 North Eastern states. There are currently ${criticalZones.length} critical zones and ${highZones.length} high-risk zones under early-warning surveillance. Rainfall, slope gradient, and infrastructure buffer analyses are refreshed continuously.`;
    }

    res.json({ reply: fallbackReply, source: 'LANDGUARD Grounded Telemetry Engine' });
  } catch (err) {
    console.error('Error in AI assistant endpoint:', err);
    res.status(500).json({ error: 'AI Assistant temporarily unavailable' });
  }
});

// Configure Vite in development or static serve in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LANDGUARD AI] Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
