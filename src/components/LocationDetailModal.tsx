import React, { useState } from 'react';
import { LocationFullReport } from '../types/landguard';
import {
  X,
  ShieldAlert,
  CloudRain,
  Mountain,
  History,
  Activity,
  Users,
  Building,
  School,
  Hospital,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Compass,
  Calculator,
  Brain,
  GitCompare,
  Clock,
} from 'lucide-react';

interface LocationDetailModalProps {
  report: LocationFullReport | null;
  onClose: () => void;
  onOpenFullReport?: (locationId: string) => void;
  onOpenTimeline?: (locationId: string) => void;
  onAskAI?: (locationId: string) => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  report,
  onClose,
  onOpenFullReport,
  onOpenTimeline,
  onAskAI,
}) => {
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(2.5);

  if (!report) return null;

  const { location, weather, risk, impact, alert, historicalNearby } = report;

  // Color mapping
  const riskColor =
    risk.riskLevel === 'CRITICAL'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/40'
      : risk.riskLevel === 'HIGH'
      ? 'text-orange-400 bg-orange-500/10 border-orange-500/40'
      : risk.riskLevel === 'MODERATE'
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';

  const riskBarColor =
    risk.riskLevel === 'CRITICAL'
      ? 'bg-rose-500 shadow-rose-500/50'
      : risk.riskLevel === 'HIGH'
      ? 'bg-orange-500 shadow-orange-500/50'
      : risk.riskLevel === 'MODERATE'
      ? 'bg-yellow-400 shadow-yellow-400/50'
      : 'bg-emerald-500 shadow-emerald-500/50';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] z-50 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-start justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-slate-800 text-cyan-400 border border-slate-700">
              {location.state} · {location.district}
            </span>
            {risk.isHotspot && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3" /> ACTIVE HOTSPOT
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Priority: {impact.overallPriority}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            {location.name}
          </h2>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
            <span>Lat: {location.lat.toFixed(4)}°N</span>
            <span>Lng: {location.lng.toFixed(4)}°E</span>
            <span>Elev: {location.elevation}m</span>
            <span className="text-cyan-400">Updated: {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label="Close detail panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 divide-y divide-slate-800/60">
        {/* Section 1: Main Risk Score & Badge */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Landslide Susceptibility Score
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${riskColor}`}>
              {risk.riskLevel} SUSCEPTIBILITY
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight font-display text-white">
              {risk.compositeScore}
            </span>
            <span className="text-slate-400 text-sm font-mono">/ 100</span>
            <div className="flex-1 ml-2">
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-md ${riskBarColor}`}
                  style={{ width: `${risk.compositeScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Explainable AI statement */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Explainable Risk Assessment
            </div>
            <p>{risk.explanation}</p>
          </div>

          {/* Temporal Delta: Why Did Risk Change? */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-slate-300 leading-relaxed space-y-1">
            <div className="flex items-center justify-between text-amber-400 font-bold font-mono text-[11px]">
              <span className="flex items-center gap-1"><GitCompare className="w-3.5 h-3.5" /> TEMPORAL DELTA ANALYSIS</span>
              <span>{(risk.scoreDelta ?? 0) > 0 ? `+${risk.scoreDelta} pts` : `${risk.scoreDelta ?? 0} pts`}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              <strong className="text-amber-300">Driver: </strong>
              {risk.deltaDriver || `Antecedent precipitation moisture shifted pore-water saturation.`}
            </p>
          </div>

          {/* Hybrid Decision Support Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-purple-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> Hybrid Decision Support
              </span>
              <span className="text-[9px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                Physical 80% + ML 20%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-[9px] text-cyan-400">PHYSICAL</div>
                <div className="text-base font-bold text-white">{risk.physicalScore ?? risk.compositeScore}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-[9px] text-purple-400">ML PROB</div>
                <div className="text-base font-bold text-purple-300">{risk.mlSusceptibility ?? 76}%</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-emerald-500/50">
                <div className="text-[9px] text-emerald-400">DECISION</div>
                <div className="text-base font-bold text-emerald-300">{risk.hybridScore ?? risk.compositeScore}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 4 Contributing Factors Breakdown */}
        <div className="pt-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Factor Point Contributions</span>
            <span className="text-[10px] text-cyan-400 font-mono">Sum: {risk.compositeScore} pts</span>
          </h3>

          <div className="space-y-2.5">
            {/* Factor 1: Rainfall */}
            <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Rainfall Intensity & Antecedent (35%)
                </span>
                <div className="font-mono text-xs">
                  <span className="text-slate-400 font-bold">{risk.rainfall.score}/100</span>
                  <span className="text-sky-400 font-bold ml-2">
                    +{risk.contributions?.rainfallPts ?? (risk.rainfall.score * 0.35).toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-sky-400 h-full rounded-full"
                  style={{ width: `${risk.rainfall.score}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{risk.rainfall.summary}</span>
                <span className="font-mono text-slate-300">{risk.rainfall.actualMetric}</span>
              </div>
            </div>

            {/* Factor 2: Slope */}
            <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" /> Terrain Slope & Incline (30%)
                </span>
                <div className="font-mono text-xs">
                  <span className="text-slate-400 font-bold">{risk.slope.score}/100</span>
                  <span className="text-amber-400 font-bold ml-2">
                    +{risk.contributions?.slopePts ?? (risk.slope.score * 0.30).toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${risk.slope.score}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{risk.slope.summary}</span>
                <span className="font-mono text-slate-300">{risk.slope.actualMetric}</span>
              </div>
            </div>

            {/* Factor 3: Historical Activity */}
            <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <History className="w-3.5 h-3.5 text-purple-400" /> Historical Landslide Proximity (20%)
                </span>
                <div className="font-mono text-xs">
                  <span className="text-slate-400 font-bold">{risk.historical.score}/100</span>
                  <span className="text-purple-400 font-bold ml-2">
                    +{risk.contributions?.historicalPts ?? (risk.historical.score * 0.20).toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-purple-400 h-full rounded-full"
                  style={{ width: `${risk.historical.score}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="truncate pr-2">{risk.historical.summary}</span>
                <span className="font-mono text-slate-300 shrink-0">{risk.historical.actualMetric}</span>
              </div>
            </div>

            {/* Factor 4: Terrain / Lithology */}
            <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Lithology & Ruggedness (15%)
                </span>
                <div className="font-mono text-xs">
                  <span className="text-slate-400 font-bold">{risk.terrain.score}/100</span>
                  <span className="text-emerald-400 font-bold ml-2">
                    +{risk.contributions?.terrainPts ?? (risk.terrain.score * 0.15).toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${risk.terrain.score}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="truncate pr-2">{risk.terrain.summary}</span>
                <span className="font-mono text-slate-300 shrink-0">{risk.terrain.actualMetric}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: "WHO IS AT RISK?" Impact Analysis */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4" /> "Who Is At Risk?" Impact Analysis
            </h3>
            <span className="text-[11px] text-slate-400">Buffer: 2.5 km</span>
          </div>

          {/* Impact Priority Card */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-medium text-slate-300">Authority Impact Priority</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  impact.overallPriority === 'URGENT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500'
                    : impact.overallPriority === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500'
                }`}
              >
                {impact.overallPriority} PRIORITY
              </span>
            </div>

            {/* 3 Pillar Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Environmental Risk</div>
                <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                  {impact.environmentalRiskScore}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Infra Exposure</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                  {impact.infrastructureExposureScore}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Pop Exposure</div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {impact.populationExposureScore}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-normal">
              {impact.priorityReason}
            </p>

            {/* Counts in buffer zone */}
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-center">
              <div>
                <div className="text-lg font-bold text-white font-mono">{impact.settlementsCount}</div>
                <div className="text-[10px] text-slate-400">Settlements</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-mono">{impact.schoolsCount}</div>
                <div className="text-[10px] text-slate-400">Schools</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-mono">{impact.hospitalsCount}</div>
                <div className="text-[10px] text-slate-400">Hospitals</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-mono">{impact.majorRoadsCount}</div>
                <div className="text-[10px] text-slate-400">Roads/Rails</div>
              </div>
            </div>
          </div>

          {/* List of nearby infrastructure items */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Identified Vulnerable Assets Nearby
            </div>
            {impact.nearbyInfrastructure.map((infra) => (
              <div
                key={infra.id}
                className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {infra.type === 'hospital' && <Hospital className="w-3.5 h-3.5 text-rose-400" />}
                    {infra.type === 'school' && <School className="w-3.5 h-3.5 text-amber-400" />}
                    {infra.type === 'road' && <Building className="w-3.5 h-3.5 text-sky-400" />}
                    {infra.type === 'settlement' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
                    {infra.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{infra.details}</div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-mono text-cyan-400 font-bold text-[11px]">
                    {infra.distanceKm} km
                  </span>
                  {infra.capacityOrPop && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      ~{infra.capacityOrPop} souls
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Early Warning Advisory for Authorities */}
        {alert && (
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Decision-Support Actions (NDMA / SDMA)
            </h3>
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2">
              <div className="text-xs font-semibold text-rose-300">
                Trigger: {alert.triggerReason}
              </div>
              <ul className="space-y-1.5 pt-1 text-xs text-slate-300">
                {alert.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold font-mono">▸</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        {onOpenTimeline && (
          <button
            onClick={() => onOpenTimeline(location.id)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        )}

        {onAskAI && (
          <button
            onClick={() => onAskAI(location.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Ask AI About This Site
          </button>
        )}

        {onOpenFullReport && (
          <button
            onClick={() => onOpenFullReport(location.id)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <span>Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
