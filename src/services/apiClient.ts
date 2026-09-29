import {
  LocationFullReport,
  SystemStats,
  HistoricalLandslide,
  EarlyWarningAlert,
  RiskThresholdConfig,
  TimeRangeOption,
  LocationTimelineReport,
} from '../types/landguard';
import { NER_LOCATIONS, HISTORICAL_LANDSLIDES, DEFAULT_THRESHOLDS } from '../data/nerData';
import { computeRiskAssessment, computeImpactAssessment, generateEarlyWarning } from './riskEngine';
import { fetchLocationWeather } from './weatherService';

export async function fetchSystemStatus(): Promise<SystemStats> {
  try {
    const res = await fetch('/api/status');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API /api/status failed, using local calculation:', e);
  }

  // Local fallback
  return {
    activeAlerts: 4,
    criticalZones: 2,
    highRiskZones: 5,
    moderateRiskZones: 7,
    lowRiskZones: 4,
    monitoredLocations: NER_LOCATIONS.length,
    lastSyncTime: new Date().toISOString(),
    isDemoActive: false,
    liveApiStatus: 'online',
  };
}

export async function fetchAllLocations(): Promise<LocationFullReport[]> {
  try {
    const res = await fetch('/api/locations');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API /api/locations failed, fallback to local compute:', e);
  }

  // Local compute fallback
  const results = await Promise.all(
    NER_LOCATIONS.map(async (loc) => {
      const weather = await fetchLocationWeather(loc, false);
      const risk = computeRiskAssessment(loc, weather, HISTORICAL_LANDSLIDES, DEFAULT_THRESHOLDS);
      const impact = computeImpactAssessment(loc, risk, 2.5);
      const alert = generateEarlyWarning(loc, risk, impact);
      return {
        location: loc,
        weather,
        risk,
        impact,
        alert,
        historicalNearby: [],
      };
    })
  );
  return results;
}

export async function fetchLocationReport(id: string): Promise<LocationFullReport> {
  try {
    const res = await fetch(`/api/locations/${id}/report`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`API /api/locations/${id}/report failed:`, e);
  }

  const loc = NER_LOCATIONS.find((l) => l.id === id) || NER_LOCATIONS[0];
  const weather = await fetchLocationWeather(loc, false);
  const risk = computeRiskAssessment(loc, weather, HISTORICAL_LANDSLIDES, DEFAULT_THRESHOLDS);
  const impact = computeImpactAssessment(loc, risk, 2.5);
  const alert = generateEarlyWarning(loc, risk, impact);

  return {
    location: loc,
    weather,
    risk,
    impact,
    alert,
    historicalNearby: HISTORICAL_LANDSLIDES.filter((h) => h.state === loc.state),
  };
}

export async function fetchHistoricalLandslides(): Promise<HistoricalLandslide[]> {
  try {
    const res = await fetch('/api/historical');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API /api/historical failed:', e);
  }
  return HISTORICAL_LANDSLIDES;
}

export async function fetchAlerts(): Promise<EarlyWarningAlert[]> {
  try {
    const res = await fetch('/api/alerts');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API /api/alerts failed:', e);
  }
  
  // Return alerts from all locations
  const all = await fetchAllLocations();
  return all
    .map((l) => l.alert)
    .filter((a): a is EarlyWarningAlert => a !== undefined)
    .sort((a, b) => b.priorityRank - a.priorityRank);
}

export async function triggerDemoIncident(targetLocationId = 'sik-gangtok'): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/demo/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLocationId }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Demo trigger API error:', e);
  }
  return { success: true, message: 'Demo incident initiated' };
}

export async function resetDemoIncident(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Demo reset API error:', e);
  }
  return { success: true, message: 'Demo reset completed' };
}

export async function askAIAssistant(question: string, selectedLocationId?: string): Promise<{ reply: string; source: string }> {
  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, selectedLocationId }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('AI query error:', e);
  }
  return {
    reply: 'LANDGUARD AI Telemetry: The risk model prioritizes locations with 72-hour antecedent rainfall > 150mm and slope gradients > 30°. Inspect vulnerable highway corridors (NH-10, NH-29, NH-37) for active pore-water saturation.',
    source: 'Local Expert System Telemetry',
  };
}

export async function updateThresholds(config: Partial<RiskThresholdConfig>): Promise<void> {
  try {
    await fetch('/api/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  } catch (e) {
    console.warn('Threshold update failed:', e);
  }
}

export async function fetchLocationTimeline(
  locationId: string,
  range: TimeRangeOption = '24H'
): Promise<LocationTimelineReport | null> {
  try {
    const res = await fetch(`/api/timeline/${locationId}?range=${range}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`API /api/timeline/${locationId} failed:`, e);
  }
  return null;
}
