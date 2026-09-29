import React, { useState, useMemo } from 'react';
import { LocationFullReport, SystemStats, EarlyWarningAlert, HistoricalLandslide, PriorityLevel } from '../types/landguard';
import { MapComponent } from '../components/MapComponent';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  CloudRain,
  Mountain,
  Users,
  BellRing,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Database,
  Radio,
  Layers,
  FileText,
  Zap,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { AppView } from '../components/Navbar';
import { useDemoIncident } from '../context/DemoIncidentContext';

interface DashboardViewProps {
  stats: SystemStats | null;
  locations: LocationFullReport[];
  historicalLandslides: HistoricalLandslide[];
  alerts: EarlyWarningAlert[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onNavigate: (view: AppView) => void;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  locations,
  historicalLandslides,
  alerts,
  selectedLocationId,
  onSelectLocation,
  onNavigate,
  onRefreshData,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('ALL');

  const {
    state: demoState,
    togglePlay,
    restart,
  } = useDemoIncident();

  // If demo is active, synchronize the target location (Gangtok) with the central incident state
  const effectiveLocations = useMemo(() => {
    if (!demoState.active) return locations;

    return locations.map((item) => {
      if (item.location.id === demoState.locationId) {
        return {
          ...item,
          weather: {
            ...item.weather,
            currentRainfallMm: demoState.rainfallRateMmH,
            accumulatedRain72hMm: demoState.antecedentSaturationMm,
            weatherDescription:
              demoState.riskLevel === 'CRITICAL'
                ? 'Severe Cloudburst Deluge (DEMO / SIMULATION)'
                : demoState.riskLevel === 'HIGH'
                ? 'Heavy Rain Surcharge (DEMO / SIMULATION)'
                : 'Simulated Influx (DEMO / SIMULATION)',
            isRealApi: false,
            source: 'Simulated Cloudburst Incident (DEMO / SIMULATION)',
          },
          risk: {
            ...item.risk,
            compositeScore: demoState.physicalRisk,
            physicalScore: demoState.physicalRisk,
            mlSusceptibility: demoState.mlRisk,
            hybridScore: demoState.hybridRisk,
            riskLevel: demoState.riskLevel,
            isHotspot: demoState.hotspotActive,
            explanation: demoState.scientificInsight,
          },
          impact: {
            ...item.impact,
            radiusKm: demoState.bufferRadiusKm,
            nearbyInfrastructure: demoState.exposedInfrastructure,
            settlementsCount: demoState.exposedCounts.settlements,
            schoolsCount: demoState.exposedCounts.schools,
            hospitalsCount: demoState.exposedCounts.hospitals,
            majorRoadsCount: demoState.exposedCounts.roads,
            overallPriority: (demoState.riskLevel === 'CRITICAL'
              ? 'URGENT'
              : demoState.riskLevel === 'HIGH'
              ? 'HIGH'
              : demoState.riskLevel === 'MODERATE'
              ? 'MODERATE'
              : 'LOW') as PriorityLevel,
          },
        };
      }
      return item;
    });
  }, [locations, demoState]);

  // Filtered locations
  const filteredLocations = effectiveLocations.filter((item) => {
    const matchesSearch =
      item.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'ALL' || item.location.state === filterState;
    return matchesSearch && matchesState;
  });

  // Top risk ranked locations
  const topRiskLocations = [...effectiveLocations].sort(
    (a, b) => b.risk.compositeScore - a.risk.compositeScore
  );

  // Risk distribution counts
  const criticalCount = effectiveLocations.filter((l) => l.risk.riskLevel === 'CRITICAL').length;
  const highCount = effectiveLocations.filter((l) => l.risk.riskLevel === 'HIGH').length;
  const modCount = effectiveLocations.filter((l) => l.risk.riskLevel === 'MODERATE').length;
  const lowCount = effectiveLocations.filter((l) => l.risk.riskLevel === 'LOW').length;
  const totalLocs = effectiveLocations.length || 1;

  const critPercent = Math.round((criticalCount / totalLocs) * 100);
  const highPercent = Math.round((highCount / totalLocs) * 100);
  const modPercent = Math.round((modCount / totalLocs) * 100);
  const lowPercent = Math.round((lowCount / totalLocs) * 100);

  const states = Array.from(new Set(effectiveLocations.map((l) => l.location.state)));

  // Simulated alerts count
  const effectiveAlertCount = demoState.active
    ? alerts.length + (demoState.alertLevel !== 'NORMAL' ? 1 : 0)
    : (stats?.activeAlerts ?? alerts.length);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight font-display">
              COMMAND CENTER DASHBOARD
            </h1>
            {demoState.active ? (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                DEMO / SIMULATION • EMERGENCY SCENARIO
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>LIVE TELEMETRY • SOURCE: OPEN-METEO • MODE: NORMAL</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            North Eastern Regional Disaster Management Intelligence & Landslide Susceptibility Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('timeline')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Timeline & Scrubber</span>
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Full GIS Map</span>
          </button>
        </div>
      </div>

      {/* System Architecture & Operational Status Card (Clean 2x2 Layout, No Internal Dividers) */}
      <div className="w-full rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Row 1: Section 1 & Section 2 */}
          <div className="p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">ENGINE</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white mt-1">Node.js / Express</div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Authoritative risk computation</div>
          </div>

          <div className="p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">WEATHER</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white mt-1">Open-Meteo</div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Near-real-time telemetry</div>
          </div>

          {/* Row 2: Section 3 & Section 4 */}
          <div className="p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">STORAGE</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white mt-1">
              {stats?.databaseStatus === 'connected' ? 'Supabase PostgreSQL' : 'Local Runtime'}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {stats?.databaseStatus === 'connected' ? 'Connected cloud persistence' : 'Supabase-ready persistence'}
            </div>
          </div>

          <div className="p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">ML</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white mt-1">Random Forest</div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Research advisory baseline</div>
          </div>
        </div>
      </div>

      {/* DEMO INCIDENT ACTIVE BANNER (Visible whenever demo simulation is running) */}
      {demoState.active && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900/90 to-amber-950/80 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-rose-500/30 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0 shadow">
                <Zap className="w-6 h-6 animate-pulse text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white font-display">
                    ⚡ DEMO INCIDENT ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white shadow">
                    CLOUDBURST / EXTREME RAINFALL SIMULATION
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                    DEMO / SIMULATION
                  </span>
                </div>
                <div className="text-xs text-rose-200/90 mt-0.5 font-mono">
                  Synthesized end-to-end multi-hazard cascade: Atmospheric Influx → Pore-Water Surcharge → Infrastructure Vulnerability
                </div>
              </div>
            </div>

            {/* Playback Mini Controls */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                onClick={togglePlay}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  demoState.isPlaying
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400 hover:bg-rose-500/40'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {demoState.isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Simulation
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Resume Scenario
                  </>
                )}
              </button>

              <button
                onClick={() => onNavigate('timeline')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 cursor-pointer transition shadow"
              >
                <Clock className="w-3.5 h-3.5" /> Live Timeline Scrubber →
              </button>
            </div>
          </div>

          {/* Banner Key Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Incident Location</div>
              <div className="font-bold text-white mt-1 truncate">{demoState.locationName}</div>
              <div className="text-[10px] text-cyan-400">{demoState.locationDistrict}, {demoState.locationState}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Current Phase</div>
              <div className="font-bold text-amber-300 mt-1 truncate">{demoState.phaseTitle}</div>
              <div className="text-[10px] text-slate-400">Step {demoState.stepIndex + 1} of {demoState.totalSteps}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Simulated Risk</div>
              <div className={`font-black text-sm mt-1 ${
                demoState.riskLevel === 'CRITICAL'
                  ? 'text-rose-400'
                  : demoState.riskLevel === 'HIGH'
                  ? 'text-orange-400'
                  : demoState.riskLevel === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {demoState.physicalRisk}/100 ({demoState.riskLevel})
              </div>
              <div className="text-[10px] text-slate-400">Hybrid: {demoState.hybridRisk}/100</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Rainfall & Saturation</div>
              <div className="font-bold text-cyan-300 mt-1">{demoState.rainfallRateMmH.toFixed(1)} mm/h</div>
              <div className="text-[10px] text-slate-400">{demoState.antecedentSaturationMm.toFixed(0)} mm 72h antecedent</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Alert Status</div>
              <div className="font-bold text-rose-300 mt-1">{demoState.alertLevel.replace('_', ' ')}</div>
              <div className="text-[10px] text-slate-400">{demoState.exposedCounts.total} Assets in Buffer</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Alerts */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              ACTIVE ALERTS
            </span>
            <BellRing className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-white">
              {effectiveAlertCount}
            </span>
            <span className="text-xs text-rose-300/80 font-mono">Issued Bulletins</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SDMA / NDMA Escalation</span>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5"
            >
              View Bulletins →
            </button>
          </div>
        </div>

        {/* Card 2: Critical Zones */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/40 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              CRITICAL ZONES
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-rose-400">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">Score 76 - 100</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Pore-water saturation &gt; critical threshold
          </div>
        </div>

        {/* Card 3: High-Risk Zones */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-orange-500/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
              HIGH-RISK ZONES
            </span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-orange-400">
              {highCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">Score 51 - 75</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Increased slope instability potential
          </div>
        </div>

        {/* Card 4: Monitored Locations */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              MONITORED LOCATIONS
            </span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-white">
              {effectiveLocations.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">Across 8 States</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{demoState.active ? 'Scenario Active' : 'Live Sync Active'}</span>
            <span className={`w-2 h-2 rounded-full ${demoState.active ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
          </div>
        </div>
      </div>

      {/* PHASE 3 & PHASE 7: DATA STATUS & TELEMETRY PANEL */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Operational Data Telemetry & Ingestion Metadata
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verified telemetry classifications: LIVE (runtime external API), DATASET (stored baseline), CALCULATED (LANDGUARD algorithm), DEMO (simulation), OPTIONAL (keyed capability).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {demoState.active || stats?.isDemoActive ? (
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                ACTIVE STATUS: DEMO SIMULATION (SYNTHETIC SCENARIO)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ACTIVE STATUS: LIVE METEOROLOGY (OPEN-METEO API)
              </span>
            )}
          </div>
        </div>

        {/* 6 Clean Telemetry Stream Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
          {/* Stream 1: Weather */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Weather
                </span>
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                  demoState.active || stats?.isDemoActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : stats?.liveApiStatus === 'online'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {demoState.active || stats?.isDemoActive ? 'DEMO' : stats?.liveApiStatus === 'online' ? 'LIVE' : 'DATASET'}
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                {demoState.active || stats?.isDemoActive ? 'Simulated Cloudburst Surge' : 'Open-Meteo Free API'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Last Sync: {stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Precipitation (1h &amp; 72h antecedent)
            </div>
          </div>

          {/* Stream 2: Terrain */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" /> Terrain
                </span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DATASET
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                SRTM / ASTER 30m DEM
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Resolution: 30m Geomorphometry
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Slope (°), Aspect, TRI Ruggedness
            </div>
          </div>

          {/* Stream 3: Historical Landslides */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Historical
                </span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DATASET
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                GSI NLSM + State Records
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Records: {historicalLandslides.length} Verified NER Events
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Spatial Proximity Decay Model
            </div>
          </div>

          {/* Stream 4: Infrastructure */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Infrastructure
                </span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DATASET
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                OSM-Derived NER Nodes
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Lifelines: Roads, Schools, Hospitals
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Dynamic 2.5km Exposure Buffer
            </div>
          </div>

          {/* Stream 5: Risk Calculation */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Risk Engine
                </span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CALCULATED
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                LANDGUARD Physical-Empirical
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Weights: 35/30/20/15 (Configurable)
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Rain, Slope, History, Lithology
            </div>
          </div>

          {/* Stream 6: AI Assistant */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono text-slate-400 uppercase flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Assistant
                </span>
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OPTIONAL
                </span>
              </div>
              <div className="font-semibold text-slate-200 text-[11px]">
                Gemini 3.8 Flash / Rule Engine
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Grounded Telemetry Q&amp;A + Voice
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
              Deterministic fallback if no key
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Side Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Risk Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
                Live Regional Geospatial Risk Map
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Click any node to inspect risk factors & infrastructure exposure
            </div>
          </div>

          <MapComponent
            locations={filteredLocations}
            historicalLandslides={historicalLandslides}
            selectedLocationId={selectedLocationId}
            onSelectLocation={onSelectLocation}
            heightClass="h-[520px]"
          />

          {/* Risk Distribution Bar Section */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold uppercase text-slate-300">
                Regional Risk Distribution
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {locations.length} Strategic Stations Monitored
              </span>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-slate-800">
              <div
                style={{ width: `${critPercent}%` }}
                className="bg-rose-500 h-full rounded-l transition-all duration-500"
                title={`Critical: ${criticalCount} (${critPercent}%)`}
              ></div>
              <div
                style={{ width: `${highPercent}%` }}
                className="bg-orange-500 h-full transition-all duration-500"
                title={`High: ${highCount} (${highPercent}%)`}
              ></div>
              <div
                style={{ width: `${modPercent}%` }}
                className="bg-yellow-400 h-full transition-all duration-500"
                title={`Moderate: ${modCount} (${modPercent}%)`}
              ></div>
              <div
                style={{ width: `${lowPercent}%` }}
                className="bg-emerald-500 h-full rounded-r transition-all duration-500"
                title={`Low: ${lowCount} (${lowPercent}%)`}
              ></div>
            </div>

            {/* Labels and values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Critical: {criticalCount} ({critPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>High: {highCount} ({highPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span>Moderate: {modCount} ({modPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Low: {lowCount} ({lowPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Risk Locations & Active Bulletins (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Top Risk Locations List */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Top Susceptibility Sectors
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Ranked by Score</span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {topRiskLocations.slice(0, 6).map((item, index) => {
                const { location, risk, weather } = item;
                const isCrit = risk.riskLevel === 'CRITICAL';
                const isHigh = risk.riskLevel === 'HIGH';

                return (
                  <div
                    key={location.id}
                    onClick={() => onSelectLocation(location.id)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      selectedLocationId === location.id
                        ? 'bg-slate-800/90 border-cyan-400/80 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-400'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">
                          {location.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>{location.state}</span>
                          <span>·</span>
                          <span>{weather.accumulatedRain72hMm.toFixed(0)}mm rain</span>
                          <span>·</span>
                          <span>{location.slope}°</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div
                        className={`text-sm font-bold font-mono ${
                          isCrit
                            ? 'text-rose-400'
                            : isHigh
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {risk.compositeScore}
                      </div>
                      <div
                        className={`text-[9px] font-mono uppercase font-bold px-1 rounded ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {risk.riskLevel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Emergency Early Warning Bulletins */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <BellRing className="w-4 h-4" /> Priority Early Warnings
              </h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All Bulletins ({alerts.length})
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active critical alerts currently issued.
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onSelectLocation(alert.locationId)}
                    className="p-3 rounded-lg bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/60 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{alert.locationName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {alert.severity} ({alert.riskScore}/100)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {alert.triggerReason}
                    </p>
                    <div className="text-[10px] text-rose-400/90 font-mono pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span>Priority Rank: #{alert.priorityRank}</span>
                      <span className="text-cyan-400">Inspect Actions →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
