import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LocationFullReport,
  TimeRangeOption,
  TimelineDataPoint,
  LocationTimelineReport,
  RiskLevel,
} from '../types/landguard';
import { fetchLocationTimeline } from '../services/apiClient';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CloudRain,
  Mountain,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Building2,
  Hospital,
  School,
  ArrowDown,
  Info,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import L from 'leaflet';
import { useDemoIncident } from '../context/DemoIncidentContext';
import { DEMO_INCIDENT_STEPS } from '../data/demoIncidentData';

interface TimelineViewProps {
  locations: LocationFullReport[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onNavigateToMap: (id: string) => void;
  isDemoActive: boolean;
  onTriggerDemo: () => void;
  onResetDemo: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onNavigateToMap,
  isDemoActive,
  onTriggerDemo,
  onResetDemo,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>('24H');
  const [timelineReport, setTimelineReport] = useState<LocationTimelineReport | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number>(0);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    state: demoState,
    togglePlay: demoTogglePlay,
    restart: demoRestart,
    replay: demoReplay,
    seekToStep: demoSeekToStep,
    setSpeed: demoSetSpeed,
    resetDemo: demoReset,
    triggerDemo: demoTrigger,
  } = useDemoIncident();

  // Mini-map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);
  const infraGroupRef = useRef<L.LayerGroup | null>(null);

  const activeLocationId = selectedLocationId || locations[0]?.location.id || 'sik-gangtok';
  const activeLocationReport = locations.find((l) => l.location.id === activeLocationId) || locations[0];

  // Synthesize demo timeline points for Gangtok when demo is active
  const demoTimelinePoints: TimelineDataPoint[] = useMemo(() => {
    if (!demoState.active) return [];
    const now = new Date();
    return DEMO_INCIDENT_STEPS.map((step) => {
      const pDate = new Date(now.getTime() - step.hoursAgo * 3600000);
      const displayTime =
        step.hoursAgo === 0
          ? 'Now'
          : pDate.toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

      return {
        timestamp: pDate.toISOString(),
        isoTime: pDate.toISOString(),
        displayTime,
        hoursAgo: step.hoursAgo,
        rainfallRateMmH: step.rainfallRateMmH,
        rainfallAccum72hMm: step.accumulatedRain72hMm,
        rainfallFactorScore: Math.min(100, Math.round(step.rainfallRateMmH * 2.5)),
        rainfallFactorLevel: (step.riskLevel === 'CRITICAL'
          ? 'Critical'
          : step.riskLevel === 'HIGH'
          ? 'High'
          : step.riskLevel === 'MODERATE'
          ? 'Moderate'
          : 'Low') as 'Low' | 'Moderate' | 'High' | 'Critical',
        slopeScore: 38,
        terrainScore: 78,
        historicalScore: 65,
        physicalScore: step.physicalRisk,
        mlSusceptibility: step.mlSusceptibility,
        hybridScore: step.hybridScore,
        riskLevel: step.riskLevel,
        isHotspot: step.isHotspot,
        explanation: step.summary,
        exposedInfrastructureCount:
          step.bufferRadiusKm >= 2.5 ? 6 : step.bufferRadiusKm >= 2.0 ? 5 : step.bufferRadiusKm >= 1.4 ? 3 : 1,
        exposedSettlementsCount: step.bufferRadiusKm >= 1.9 ? 1 : 0,
        exposedPopulation: step.bufferRadiusKm >= 1.9 ? 3200 : 0,
        exposedSchoolsCount: step.bufferRadiusKm >= 1.1 ? 2 : step.bufferRadiusKm >= 0.8 ? 1 : 0,
        exposedHospitalsCount: step.bufferRadiusKm >= 1.4 ? 1 : 0,
        exposedRoadsCount: 1,
        alertEscalationStatus: step.alertLevel,
        alertPriority:
          step.riskLevel === 'CRITICAL'
            ? 'URGENT'
            : step.riskLevel === 'HIGH'
            ? 'HIGH'
            : step.riskLevel === 'MODERATE'
            ? 'MODERATE'
            : 'LOW',
        primaryCause: step.scientificInsight,
      };
    });
  }, [demoState.active]);

  // Fetch timeline data whenever location or time range changes (for real Open-Meteo telemetry)
  useEffect(() => {
    let isCancelled = false;
    const loadTimeline = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLocationTimeline(activeLocationId, selectedRange);
        if (!isCancelled && data && data.points.length > 0) {
          setTimelineReport(data);
          if (!demoState.active) {
            setActivePointIndex(data.points.length - 1);
            setIsPlaying(false);
          }
        }
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadTimeline();
    return () => {
      isCancelled = true;
    };
  }, [activeLocationId, selectedRange, demoState.active]);

  // Normal-mode playback timer loop
  useEffect(() => {
    if (demoState.active || !isPlaying || !timelineReport || timelineReport.points.length <= 1) return;

    const intervalMs = Math.round(1100 / playbackSpeed);
    const interval = setInterval(() => {
      setActivePointIndex((prev) => {
        if (prev >= timelineReport.points.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timelineReport, demoState.active]);

  // Unified points list
  const isGangtokDemo = demoState.active && activeLocationId === 'sik-gangtok';
  const points = isGangtokDemo && demoTimelinePoints.length > 0
    ? demoTimelinePoints
    : (timelineReport?.points || []);

  const effectiveActiveIndex = isGangtokDemo
    ? Math.min(points.length - 1, Math.max(0, demoState.stepIndex))
    : activePointIndex;

  const effectiveIsPlaying = isGangtokDemo ? demoState.isPlaying : isPlaying;
  const effectiveSpeed = isGangtokDemo ? demoState.playbackSpeed : playbackSpeed;

  // Currently inspected point
  const currentPoint = useMemo(() => {
    if (points.length === 0) return null;
    const idx = hoveredPointIndex !== null ? hoveredPointIndex : effectiveActiveIndex;
    return points[Math.min(points.length - 1, Math.max(0, idx))];
  }, [points, effectiveActiveIndex, hoveredPointIndex]);

  // Initialize and update mini GIS map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeLocationReport.location.lat, activeLocationReport.location.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
      if (!cartoApiKey) {
        console.warn(
          '[LANDGUARD AI] CARTO basemap API key is missing. Set VITE_CARTO_API_KEY in your environment to authenticate CARTO Dark Matter raster tiles.'
        );
      }
      const tileUrl = cartoApiKey
        ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoApiKey}`
        : 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);

      infraGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.setView([activeLocationReport.location.lat, activeLocationReport.location.lng], 12);

    // Update nearby infrastructure markers
    if (infraGroupRef.current) {
      infraGroupRef.current.clearLayers();
      activeLocationReport.impact.nearbyInfrastructure.forEach((infra) => {
        let symbol = '📍';
        if (infra.type === 'hospital') symbol = '🏥';
        else if (infra.type === 'school') symbol = '🏫';
        else if (infra.type === 'road') symbol = '🛣';
        else if (infra.type === 'settlement') symbol = '🏘';

        const infraIcon = L.divIcon({
          html: `<div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-900/90 border border-slate-700 shadow" title="${infra.name}">${symbol}</div>`,
          className: 'mini-infra-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const m = L.marker([infra.lat, infra.lng], { icon: infraIcon });
        m.bindTooltip(`${infra.name} (${infra.distanceKm} km)`, { direction: 'top', className: 'dark-leaflet-popup' });
        infraGroupRef.current?.addLayer(m);
      });
    }

    return () => {
      // Map cleanup on unmount
    };
  }, [activeLocationReport]);

  // Synchronize mini-map marker & buffer circle with current timeline point
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPoint) return;
    const map = mapInstanceRef.current;

    const loc = activeLocationReport.location;
    const riskLevel = currentPoint.riskLevel;

    let markerColor = '#10b981'; // Green
    let pulseHtml = '';
    if (riskLevel === 'CRITICAL') {
      markerColor = '#ef4444';
      pulseHtml = `<div class="absolute -inset-2 rounded-full border-2 border-rose-500 animate-ping opacity-75"></div>`;
    } else if (riskLevel === 'HIGH') {
      markerColor = '#f97316';
      pulseHtml = `<div class="absolute -inset-1.5 rounded-full border border-orange-500 animate-pulse opacity-60"></div>`;
    } else if (riskLevel === 'MODERATE') {
      markerColor = '#eab308';
    }

    const iconHtml = `
      <div class="relative flex items-center justify-center">
        ${currentPoint.isHotspot ? pulseHtml : ''}
        <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-lg border-2 border-slate-950 font-mono text-white transition-all duration-300"
             style="background-color: ${markerColor}">
          ${currentPoint.physicalScore}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'timeline-map-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (markerRef.current) {
      markerRef.current.setIcon(icon);
      markerRef.current.setLatLng([loc.lat, loc.lng]);
    } else {
      markerRef.current = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
    }

    // Dynamic active buffer radius corresponding to current point hazard severity:
    // LOW: 800m, MODERATE: 1400m, HIGH: 2000m, CRITICAL: 2500m
    const activeRadiusMeters = riskLevel === 'CRITICAL'
      ? 2500
      : riskLevel === 'HIGH'
      ? 2000
      : riskLevel === 'MODERATE'
      ? 1400
      : 800;

    // Buffer Circle
    if (bufferCircleRef.current) {
      bufferCircleRef.current.setRadius(activeRadiusMeters);
      bufferCircleRef.current.setStyle({
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: currentPoint.isHotspot ? 0.30 : riskLevel === 'HIGH' ? 0.20 : 0.12,
      });
    } else {
      bufferCircleRef.current = L.circle([loc.lat, loc.lng], {
        radius: activeRadiusMeters,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '3, 4',
      }).addTo(map);
    }

    // Synchronize infrastructure markers with active hazard zone
    if (infraGroupRef.current) {
      infraGroupRef.current.clearLayers();
      const activeRadiusKm = activeRadiusMeters / 1000;
      activeLocationReport.impact.nearbyInfrastructure.forEach((infra) => {
        let symbol = '📍';
        if (infra.type === 'hospital') symbol = '🏥';
        else if (infra.type === 'school') symbol = '🏫';
        else if (infra.type === 'road') symbol = '🛣';
        else if (infra.type === 'settlement') symbol = '🏘';

        const isExposed = infra.distanceKm <= activeRadiusKm;
        const badgeBorder = isExposed
          ? (riskLevel === 'CRITICAL'
              ? 'border-rose-500 bg-rose-950/95 ring-2 ring-rose-500/60 shadow-rose-950 shadow-md text-white'
              : riskLevel === 'HIGH'
              ? 'border-orange-500 bg-orange-950/90 ring-1 ring-orange-500/50 text-white'
              : 'border-amber-500 bg-amber-950/80 ring-1 ring-amber-500/40 text-amber-200')
          : 'border-slate-800 bg-slate-950/70 opacity-40 text-slate-400';

        const infraIcon = L.divIcon({
          html: `<div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeBorder} shadow transition-all duration-300" title="${infra.name} (${infra.distanceKm} km)">${symbol}</div>`,
          className: 'mini-infra-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const m = L.marker([infra.lat, infra.lng], { icon: infraIcon });
        m.bindTooltip(
          `${infra.name} (${infra.distanceKm} km) • ${isExposed ? 'ACTIVE HAZARD ZONE' : 'Outside immediate buffer'}`,
          { direction: 'top', className: 'dark-leaflet-popup' }
        );
        infraGroupRef.current?.addLayer(m);
      });
    }
  }, [currentPoint, activeLocationReport]);

  const maxRain = useMemo(() => {
    if (points.length === 0) return 10;
    const peak = Math.max(...points.map((p) => p.rainfallRateMmH));
    if (peak <= 0.5) return 2.0;
    if (peak <= 2.0) return 5.0;
    if (peak <= 5.0) return 10.0;
    if (peak <= 15.0) return 20.0;
    return Math.max(25, Math.ceil(peak * 1.25));
  }, [points]);

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header & Live Telemetry Truth Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Mandated Section 5 Explicit Mode Box */}
        {demoState.active ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900/90 to-amber-950/80 border-2 border-rose-500/80 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-rose-950/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span>
                <span className="font-mono font-black text-sm text-white tracking-wide">
                  DEMO INCIDENT ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950 uppercase">
                  DEMO / SIMULATION
                </span>
              </div>
              <div className="text-xs font-mono text-rose-200">
                Simulated cloudburst progression • NOT LIVE WEATHER DATA
              </div>
              <div className="text-xs text-slate-300 font-sans">
                Sector: <strong className="text-white">{demoState.locationName}</strong> · Phase: <strong className="text-amber-300">{demoState.phaseTitle}</strong> (Step {demoState.stepIndex + 1}/{demoState.totalSteps})
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={demoReset}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow"
                title="Reset simulation and return to live Open-Meteo telemetry"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET TO LIVE TELEMETRY</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-800/60 text-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <div>
                <span className="font-bold text-white">LIVE TELEMETRY</span>
                <span className="text-slate-400 ml-2">SOURCE: OPEN-METEO</span>
                <span className="text-slate-400 ml-2">MODE: NORMAL</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Authentic near-real-time atmospheric surface observations</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              Dynamic Landslide Risk Evolution & Temporal Scrubber
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Inspect how near-real-time atmospheric weather changes propagate deterministically through rainfall factor saturation, physical multi-factor stability, Random Forest ML advisory, and lifeline infrastructure exposure.
            </p>
          </div>

          {/* Quick Demo Simulator Toggle */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
            {demoState.active ? (
              <button
                onClick={demoReset}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Reset simulation and return to live Open-Meteo telemetry"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo / Return to Live Telemetry
              </button>
            ) : (
              <button
                onClick={() => demoTrigger('sik-gangtok')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-950/50 transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                title="Simulate a 6-phase convective cloudburst and pore-water surge"
              >
                <Zap className="w-3.5 h-3.5" />
                Simulate Cloudburst Influx
              </button>
            )}
          </div>
        </div>

        {/* Data Truth Table / Operational Status Strip (Strict Transparency) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-3 border-t border-slate-800 text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">WEATHER TELEMETRY</div>
            <div className={`font-bold mt-0.5 truncate ${isDemoActive ? 'text-amber-400' : 'text-cyan-300'}`}>
              {isDemoActive ? 'DEMO / SIMULATION' : 'Open-Meteo API'}
            </div>
            <div className="text-[8px] text-slate-400">
              {isDemoActive ? 'SYNTHETIC SCENARIO' : 'NEAR-REAL-TIME'}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">TERRAIN BASELINE</div>
            <div className="font-bold text-slate-200 mt-0.5 truncate">SRTM/ASTER 30m</div>
            <div className="text-[8px] text-slate-400">STATIC DATASET</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">HISTORICAL SLIDES</div>
            <div className="font-bold text-slate-200 mt-0.5 truncate">GSI NLSM Archive</div>
            <div className="text-[8px] text-slate-400">STATIC DATASET</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">INFRASTRUCTURE</div>
            <div className="font-bold text-slate-200 mt-0.5 truncate">OpenStreetMap</div>
            <div className="text-[8px] text-slate-400">STATIC GIS DATA</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">PHYSICAL ENGINE</div>
            <div className="font-bold text-emerald-400 mt-0.5 truncate">LANDGUARD Core</div>
            <div className="text-[8px] text-slate-400">CALCULATED</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">ML MODEL</div>
            <div className="font-bold text-violet-400 mt-0.5 truncate">Random Forest</div>
            <div className="text-[8px] text-slate-400">RESEARCH BASELINE</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">SPATIAL TILES</div>
            <div className="font-bold text-slate-200 mt-0.5 truncate">CartoDB Dark</div>
            <div className="text-[8px] text-slate-400">LIVE MAP TILES</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70">
            <div className="text-slate-400 text-[9px]">DECISION MODE</div>
            <div className="font-bold text-amber-300 mt-0.5 truncate">80% Phys / 20% ML</div>
            <div className="text-[8px] text-slate-400">HYBRID BLEND</div>
          </div>
        </div>
      </div>

      {/* 2. Location & Time Range Selection Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
        {/* Monitored Sector Dropdown */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-400 font-mono">Location:</span>
          <select
            value={activeLocationId}
            onChange={(e) => {
              onSelectLocation(e.target.value);
              setIsPlaying(false);
            }}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.location.id} value={loc.location.id}>
                {loc.location.name} — {loc.location.state} ({loc.risk.compositeScore}/100 {loc.risk.riskLevel})
              </option>
            ))}
          </select>
        </div>

        {/* Time Horizon Selector (1H, 6H, 12H, 24H, 72H) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          <span className="text-[11px] text-slate-400 font-mono mr-1">Range:</span>
          {(['1H', '6H', '12H', '24H', '72H'] as TimeRangeOption[]).map((range) => (
            <button
              key={range}
              onClick={() => {
                setSelectedRange(range);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                selectedRange === range
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Chart & Causal Pipeline Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column: Interactive Dual-Axis Chart & Scrubber (8 Cols) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Dual-Axis Meteorological & Risk Progression
                </h2>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-4">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/40 border border-cyan-400 inline-block"></span>
                    Rainfall (mm/h) [Left Axis]
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
                    Physical Risk (0–100) [Right Axis]
                  </span>
                  <span className="flex items-center gap-1 text-violet-400">
                    <span className="w-3 h-0.5 border-t border-dashed border-violet-400 inline-block"></span>
                    Hybrid Risk (80/20) [Right Axis]
                  </span>
                </div>
              </div>

              {/* Scrubber Playback Controls */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    if (isGangtokDemo) {
                      demoSeekToStep(0);
                    } else {
                      setActivePointIndex(0);
                      setIsPlaying(false);
                    }
                  }}
                  title="Rewind to Phase 1 start"
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (isGangtokDemo) {
                      demoTogglePlay();
                    } else {
                      if (!isPlaying && timelineReport && activePointIndex >= timelineReport.points.length - 1) {
                        setActivePointIndex(0);
                      }
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  title={effectiveIsPlaying ? 'Pause' : 'Play Timeline Evolution'}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    effectiveIsPlaying
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {effectiveIsPlaying ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> Play
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (isGangtokDemo) {
                      demoSetSpeed((effectiveSpeed === 1 ? 2 : effectiveSpeed === 2 ? 4 : 1) as 1 | 2 | 4);
                    } else {
                      setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1));
                    }
                  }}
                  title="Playback Speed"
                  className="px-2 py-1 rounded text-[11px] font-mono text-slate-300 hover:bg-slate-800 cursor-pointer font-bold"
                >
                  {effectiveSpeed}x
                </button>
              </div>
            </div>

            {/* Incident Complete Action Strip (Mandated Section 4) */}
            {isGangtokDemo && demoState.isComplete && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900/90 to-emerald-950/80 border-2 border-emerald-500/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <div>
                    <span className="font-mono font-black text-white uppercase tracking-wider">
                      INCIDENT COMPLETE
                    </span>
                    <span className="text-slate-300 ml-2">
                      Full multi-hazard scenario demonstrated through Phase 6 equilibrium.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={demoReplay}
                    className="px-3 py-1.5 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> REPLAY INCIDENT
                  </button>
                  <button
                    onClick={demoReset}
                    className="px-3 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> RESET TO LIVE TELEMETRY
                  </button>
                </div>
              </div>
            )}

            {/* SVG Interactive Dual-Axis Chart */}
            <div className="relative w-full h-[320px] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden select-none">
              {isLoading || points.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                  <Activity className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                  Synchronizing hourly telemetry from Open-Meteo...
                </div>
              ) : (
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 320"
                  preserveAspectRatio="none"
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  <defs>
                    {/* Rainfall area gradient */}
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.02" />
                    </linearGradient>

                    {/* Risk severity bands */}
                    <linearGradient id="riskZoneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                      <stop offset="25%" stopColor="#f97316" stopOpacity="0.10" />
                      <stop offset="50%" stopColor="#eab308" stopOpacity="0.06" />
                      <stop offset="75%" stopColor="#10b981" stopOpacity="0.03" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Threshold Grid Lines (Right Axis: 0, 25, 50, 75, 100) */}
                  {/* Critical Threshold: 75 */}
                  <line x1="55" y1="70" x2="745" y2="70" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
                  <text x="750" y="74" fill="#ef4444" fontSize="10" fontFamily="monospace" opacity="0.75">CRIT (75)</text>

                  {/* High Threshold: 50 */}
                  <line x1="55" y1="130" x2="745" y2="130" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                  <text x="750" y="134" fill="#f97316" fontSize="10" fontFamily="monospace" opacity="0.7">HIGH (50)</text>

                  {/* Moderate Threshold: 25 */}
                  <line x1="55" y1="190" x2="745" y2="190" stroke="#eab308" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.25" />
                  <text x="750" y="194" fill="#eab308" fontSize="10" fontFamily="monospace" opacity="0.6">MOD (25)</text>

                  {/* Baseline: 0 */}
                  <line x1="55" y1="250" x2="745" y2="250" stroke="#334155" strokeWidth="1" />
                  <text x="750" y="254" fill="#64748b" fontSize="10" fontFamily="monospace">0</text>

                  {/* Left Axis Labels (Rainfall in mm/h) */}
                  <text x="10" y="74" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    {maxRain >= 10 ? maxRain.toFixed(0) : maxRain.toFixed(1)}
                  </text>
                  <text x="10" y="160" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    {maxRain >= 10 ? (maxRain / 2).toFixed(0) : (maxRain / 2).toFixed(1)}
                  </text>
                  <text x="14" y="254" fill="#38bdf8" fontSize="10" fontFamily="monospace">0 mm</text>

                  {/* Background Risk Zone Tint */}
                  <rect x="55" y="40" width="690" height="210" fill="url(#riskZoneGrad)" />

                  {/* Render Rainfall Bars / Polygon Area (Left Axis) */}
                  {(() => {
                    const plotWidth = 690;
                    const plotHeight = 210;
                    const xStart = 55;
                    const yBase = 250;

                    const barPoints = points.map((p, i) => {
                      const x = xStart + (i / Math.max(1, points.length - 1)) * plotWidth;
                      const y = yBase - (p.rainfallRateMmH / maxRain) * plotHeight;
                      return { x, y };
                    });

                    // Build area path
                    let areaPath = `M ${barPoints[0].x} ${yBase}`;
                    barPoints.forEach((pt) => {
                      areaPath += ` L ${pt.x} ${pt.y}`;
                    });
                    areaPath += ` L ${barPoints[barPoints.length - 1].x} ${yBase} Z`;

                    return (
                      <g>
                        <path d={areaPath} fill="url(#rainGrad)" />
                        {/* Rainfall contour line */}
                        <path
                          d={barPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="1.5"
                          opacity="0.8"
                        />
                      </g>
                    );
                  })()}

                  {/* Render Physical Risk Line (Right Axis: 0-100) */}
                  {(() => {
                    const plotWidth = 690;
                    const plotHeight = 210;
                    const xStart = 55;
                    const yBase = 250;

                    const riskPoints = points.map((p, i) => {
                      const x = xStart + (i / Math.max(1, points.length - 1)) * plotWidth;
                      const y = yBase - (p.physicalScore / 100) * plotHeight;
                      return { x, y };
                    });

                    const pathD = riskPoints.reduce(
                      (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                      ''
                    );

                    return (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}

                  {/* Render Hybrid Risk Dashed Line (Right Axis: 0-100) */}
                  {(() => {
                    const plotWidth = 690;
                    const plotHeight = 210;
                    const xStart = 55;
                    const yBase = 250;

                    const hybridPoints = points.map((p, i) => {
                      const x = xStart + (i / Math.max(1, points.length - 1)) * plotWidth;
                      const y = yBase - (p.hybridScore / 100) * plotHeight;
                      return { x, y };
                    });

                    const pathD = hybridPoints.reduce(
                      (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                      ''
                    );

                    return (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.85"
                      />
                    );
                  })()}

                  {/* Render Hotspot Indicator Markers along the bottom */}
                  {points.map((p, i) => {
                    if (!p.isHotspot) return null;
                    const x = 55 + (i / Math.max(1, points.length - 1)) * 690;
                    return (
                      <circle
                        key={`hotspot-${i}`}
                        cx={x}
                        cy="255"
                        r="3.5"
                        fill="#ef4444"
                        className="animate-pulse"
                      />
                    );
                  })}

                  {/* Active Scrubber Line Cursor */}
                  {(() => {
                    const plotWidth = 690;
                    const activeIdx = hoveredPointIndex !== null ? hoveredPointIndex : effectiveActiveIndex;
                    const x = 55 + (activeIdx / Math.max(1, points.length - 1)) * plotWidth;

                    return (
                      <g>
                        <line x1={x} y1="35" x2={x} y2="265" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
                        <circle cx={x} cy="35" r="4" fill="#38bdf8" />
                        <circle cx={x} cy="265" r="4" fill="#38bdf8" />
                      </g>
                    );
                  })()}

                  {/* Interactive Invisible Overlay for Mouse Hover & Clicking */}
                  {points.map((_, i) => {
                    const plotWidth = 690;
                    const colWidth = plotWidth / Math.max(1, points.length);
                    const x = 55 + i * colWidth - colWidth / 2;

                    return (
                      <rect
                        key={`interactive-${i}`}
                        x={Math.max(55, x)}
                        y="35"
                        width={colWidth}
                        height="230"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(i)}
                        onClick={() => {
                          if (isGangtokDemo) {
                            demoSeekToStep(i);
                          } else {
                            setActivePointIndex(i);
                            setIsPlaying(false);
                          }
                        }}
                      />
                    );
                  })}
                </svg>
              )}

              {/* Time axis labels */}
              <div className="absolute bottom-1 left-[55px] right-[55px] flex justify-between text-[10px] font-mono text-slate-500 pointer-events-none">
                {points.length > 0 && (
                  <>
                    <span>{points[0].displayTime} ({selectedRange} ago)</span>
                    {points.length > 2 && (
                      <span>{points[Math.floor(points.length / 2)].displayTime}</span>
                    )}
                    <span className="text-cyan-400 font-bold">Now</span>
                  </>
                )}
              </div>
            </div>

            {/* Scrubber Range Slider (Direct Interaction) */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  TIMELINE SCRUBBER:
                  <span className="text-white font-bold">{currentPoint?.displayTime}</span>
                  <span className="text-slate-500">
                    ({currentPoint?.hoursAgo ? `${currentPoint.hoursAgo}h ago` : 'Latest Telemetry'})
                  </span>
                  {isGangtokDemo && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                      SIMULATED INCIDENT STEP {effectiveActiveIndex + 1}/{points.length}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400">
                  Step {effectiveActiveIndex + 1} of {points.length}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, points.length - 1)}
                value={effectiveActiveIndex}
                onChange={(e) => {
                  const newIndex = Number(e.target.value);
                  if (isGangtokDemo) {
                    demoSeekToStep(newIndex);
                  } else {
                    setActivePointIndex(newIndex);
                    setIsPlaying(false);
                  }
                }}
                className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* STEP 5: Rich Interactive Tooltip / Point Inspector Card */}
            {currentPoint && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  currentPoint.riskLevel === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50'
                    : currentPoint.riskLevel === 'HIGH'
                    ? 'bg-orange-950/40 border-orange-500/60'
                    : currentPoint.riskLevel === 'MODERATE'
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-emerald-950/30 border-emerald-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span>INSPECTED TIMELINE POINT • {currentPoint.displayTime}</span>
                      {isDemoActive && (
                        <span className="text-amber-400 font-bold">• SIMULATED INCIDENT STEP</span>
                      )}
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                      <span>{activeLocationReport.location.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          currentPoint.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500 text-white'
                            : currentPoint.riskLevel === 'HIGH'
                            ? 'bg-orange-500 text-slate-950'
                            : currentPoint.riskLevel === 'MODERATE'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {currentPoint.riskLevel} RISK
                      </span>
                      {currentPoint.isHotspot && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                          HOTSPOT ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400">PHYSICAL RISK</div>
                      <div className="text-lg font-black text-amber-400">{currentPoint.physicalScore}/100</div>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-3">
                      <div className="text-[9px] text-slate-400">HYBRID BLEND</div>
                      <div className="text-lg font-black text-violet-400">{currentPoint.hybridScore}/100</div>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-3">
                      <div className="text-[9px] text-slate-400">RAINFALL RATE</div>
                      <div className="text-lg font-black text-cyan-300">{currentPoint.rainfallRateMmH.toFixed(1)} mm/h</div>
                    </div>
                  </div>
                </div>

                {/* Point Breakdown Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Rainfall Factor:</div>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {currentPoint.rainfallFactorScore}/100 ({currentPoint.rainfallFactorLevel})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      72h Accum: {currentPoint.rainfallAccum72hMm.toFixed(0)} mm
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">ML Advisory Susceptibility:</div>
                    <div className="font-bold text-violet-300 mt-0.5">
                      {currentPoint.mlSusceptibility}% (Random Forest)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Curated 16-record baseline</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Exposed Infrastructure:</div>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {currentPoint.exposedInfrastructureCount} Assets in 2.5km Buffer
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ~{currentPoint.exposedPopulation.toLocaleString()} vulnerable residents
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">EWS Alert Escalation:</div>
                    <div className="font-bold text-rose-400 mt-0.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {currentPoint.alertEscalationStatus}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Priority: {currentPoint.alertPriority}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Causal Cascade & Synchronized GIS Map (4 Cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Synchronized Live Mini GIS Map */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                <Layers className="w-4 h-4 text-cyan-400" />
                Synchronized Spatial Buffer
              </div>
              <button
                onClick={() => onNavigateToMap(activeLocationId)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
              >
                Full GIS Map <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="relative h-[180px] rounded-xl overflow-hidden border border-slate-800">
              <div ref={mapContainerRef} className="w-full h-full" />
              <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] font-mono text-cyan-300 border border-slate-800">
                2.5 km Impact Buffer
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
              <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400" /> Towns
                </div>
                <div className="font-bold text-white mt-0.5">{currentPoint?.exposedSettlementsCount ?? 0}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                  <School className="w-3 h-3 text-amber-400" /> Schools
                </div>
                <div className="font-bold text-white mt-0.5">{currentPoint?.exposedSchoolsCount ?? 0}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                  <Hospital className="w-3 h-3 text-rose-400" /> Medical
                </div>
                <div className="font-bold text-white mt-0.5">{currentPoint?.exposedHospitalsCount ?? 0}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-[9px] text-slate-400">Roads</div>
                <div className="font-bold text-white mt-0.5">{currentPoint?.exposedRoadsCount ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Causal Cascade Visualizer (The Core Judge Demonstration) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Physical Causal Cascade Chain
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">Deterministic Formula</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Observe step-by-step how incoming meteorological telemetry directly cascades into physical pore-water buildup and early warning escalation:
            </p>

            {/* 8-Step Causal Pipeline */}
            <div className="space-y-2 pt-1">
              {/* Step 1: Real Weather Change */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">REAL WEATHER CHANGE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    Open-Meteo near-real-time precipitation telemetry
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-cyan-300 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.rainfallRateMmH.toFixed(1)} mm/h` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 2: Rainfall Change */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">RAINFALL CHANGE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    72h Antecedent Pore-Water Saturation
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-cyan-300 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.rainfallAccum72hMm.toFixed(0)} mm` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 3: Rainfall Factor Change */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">RAINFALL FACTOR CHANGE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    40% Hourly Rate + 60% Antecedent Saturation
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-amber-400 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.rainfallFactorScore}/100` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 4: Physical Risk Change */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">PHYSICAL RISK CHANGE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    35% Rain + 30% Slope + 20% Hist + 15% Terrain
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-amber-400 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.physicalScore}/100` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 5: Hybrid Risk Change */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-950 text-violet-400 border border-violet-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  5
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">HYBRID RISK CHANGE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    80% Physical + 20% Random Forest Advisory
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-violet-400 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.hybridScore}/100` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 6: Hotspot Activation */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-3 transition ${
                  currentPoint?.isHotspot
                    ? 'bg-rose-950/50 border-rose-500 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    currentPoint?.isHotspot
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  6
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">HOTSPOT ACTIVATION</div>
                  <div className="text-xs font-semibold text-slate-200">
                    (Slope ≥ 60 & Rain ≥ 55) OR Score ≥ 72
                  </div>
                </div>
                <div
                  className={`text-right font-mono text-xs font-bold shrink-0 ${
                    currentPoint?.isHotspot ? 'text-rose-400' : 'text-slate-500'
                  }`}
                >
                  {currentPoint?.isHotspot ? 'ACTIVE BEACON' : 'STANDBY'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 7: Infrastructure Exposure */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  7
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">INFRASTRUCTURE EXPOSURE</div>
                  <div className="text-xs font-semibold text-slate-200">
                    2.5 km Spatial Asset Buffer Query
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-blue-300 font-bold shrink-0">
                  {currentPoint ? `${currentPoint.exposedInfrastructureCount} Assets` : '--'}
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 8: Alert Escalation */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-3 transition ${
                  currentPoint?.riskLevel === 'CRITICAL'
                    ? 'bg-rose-950/80 border-rose-500 shadow-md shadow-rose-950'
                    : currentPoint?.riskLevel === 'HIGH'
                    ? 'bg-orange-950/50 border-orange-500'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    currentPoint?.riskLevel === 'CRITICAL'
                      ? 'bg-rose-600 text-white animate-bounce'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  8
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">ALERT ESCALATION</div>
                  <div className="text-xs font-semibold text-slate-200">
                    Early Warning Decision Protocol
                  </div>
                </div>
                <div
                  className={`text-right font-mono text-xs font-bold shrink-0 ${
                    currentPoint?.riskLevel === 'CRITICAL'
                      ? 'text-rose-400'
                      : currentPoint?.riskLevel === 'HIGH'
                      ? 'text-orange-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentPoint?.alertEscalationStatus ?? 'NORMAL'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
